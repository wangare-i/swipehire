import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle, Heart, Send } from "lucide-react-native";
import type { Post } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FeedScreen() {
  const { idToken, user } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/posts", idToken)
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, [idToken]);

  const submit = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await apiFetch("/posts", idToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: user?.name ?? "You", content }),
      });
      if (!res.ok) throw new Error("Failed to post");
      const post = (await res.json()) as Post;
      setPosts((prev) => (prev ? [post, ...prev] : [post]));
      setContent("");
    } catch {
      setError("Couldn't post right now. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const like = async (postId: string) => {
    setPosts(
      (prev) =>
        prev?.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)) ??
        null
    );
    await apiFetch("/posts", idToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.screenHeader}>
        <View style={s.headerLeft}>
          <MessageCircle color={colors.pink} size={24} />
          <Text style={s.headerTitle}>Feed</Text>
        </View>
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View style={[s.card, styles.composer]}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Share a tip, a win, or what you're job hunting for…"
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={3}
              style={styles.composerInput}
            />
            <View style={styles.composerFooter}>
              {error ? (
                <Text style={s.errorText}>{error}</Text>
              ) : (
                <View />
              )}
              <Pressable
                onPress={submit}
                disabled={!content.trim() || posting}
                style={[
                  styles.postButton,
                  (!content.trim() || posting) && s.disabled,
                ]}
              >
                <Send size={14} color="#fff" />
                <Text style={styles.postButtonText}>Post</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          posts === null ? (
            <Text style={[s.mutedText, styles.centerText]}>Loading…</Text>
          ) : (
            <Text style={[s.mutedText, styles.centerText]}>
              No posts yet. Be the first to share something.
            </Text>
          )
        }
        renderItem={({ item: post }) => (
          <View style={s.card}>
            <View style={styles.postHeader}>
              <LinearGradient
                colors={[colors.pink, colors.orange]}
                style={styles.postAvatar}
              >
                <Text style={styles.postAvatarText}>
                  {post.author.slice(0, 1).toUpperCase()}
                </Text>
              </LinearGradient>
              <View>
                <Text style={styles.postAuthor}>{post.author}</Text>
                <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <Pressable onPress={() => like(post.id)} style={styles.likeRow}>
              <Heart size={14} color={colors.textDim} />
              <Text style={styles.likeCount}>{post.likes}</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerText: {
    marginTop: 32,
    textAlign: "center",
  },
  composer: {
    marginBottom: 20,
    gap: 8,
  },
  composerInput: {
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: "top",
  },
  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.pink,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  postAvatar: {
    height: 32,
    width: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  postAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  postTime: {
    fontSize: 11,
    color: colors.textDim,
  },
  postContent: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  likeRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    color: colors.textDim,
  },
});
