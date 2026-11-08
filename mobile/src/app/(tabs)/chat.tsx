import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, MessageSquare, Send } from "lucide-react-native";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isMatchUnread, markMatchSeen } from "@/lib/chatSeen";
import type { MatchSummary, Message } from "@/lib/types";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

const POLL_MS = 3000;

export default function ChatScreen() {
  const { idToken } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<MatchSummary | null>(null);

  const load = useCallback(() => {
    apiFetch("/matches", idToken)
      .then((r) => r.json())
      .then(async (data: MatchSummary[]) => {
        const sorted = [...data].sort((a, b) =>
          (b.lastMessageAt ?? b.matchedAt).localeCompare(a.lastMessageAt ?? a.matchedAt)
        );
        setMatches(sorted);
        const entries = await Promise.all(
          sorted.map(async (m) => [m.matchId, await isMatchUnread(m)] as const)
        );
        setUnreadMap(Object.fromEntries(entries));
      })
      .catch(() => setMatches([]));
  }, [idToken]);

  useEffect(load, [load]);

  if (active) {
    return (
      <Thread
        match={active}
        onBack={() => {
          setActive(null);
          load();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.screenHeader}>
        <View style={s.headerLeft}>
          <MessageSquare color={colors.pink} size={24} />
          <Text style={s.headerTitle}>Chat</Text>
        </View>
      </View>

      <FlatList
        data={matches ?? []}
        keyExtractor={(m) => m.matchId}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          matches === null ? (
            <Text style={[s.mutedText, styles.centerText]}>Loading…</Text>
          ) : (
            <View style={s.emptyState}>
              <MessageSquare size={40} color={colors.textFaint} />
              <Text style={s.emptySubtitle}>
                No matches yet. Mutual likes in Discover show up here.
              </Text>
            </View>
          )
        }
        renderItem={({ item: m }) => (
          <Pressable
            onPress={async () => {
              await markMatchSeen(m.matchId);
              setActive(m);
            }}
            style={[s.card, styles.matchRow]}
          >
            <View
              style={[styles.avatar, { backgroundColor: m.profile.color }]}
            >
              <Text style={styles.avatarText}>{m.profile.initials}</Text>
            </View>
            <View style={styles.matchInfo}>
              <Text style={styles.matchName} numberOfLines={1}>
                {m.profile.name}
              </Text>
              <Text style={styles.matchSubtitle} numberOfLines={1}>
                {m.profile.title}
                {m.profile.company ? ` @ ${m.profile.company}` : ""}
              </Text>
            </View>
            {unreadMap[m.matchId] && <View style={styles.unreadDot} />}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function Thread({
  match,
  onBack,
}: {
  match: MatchSummary;
  onBack: () => void;
}) {
  const { idToken, user } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(() => {
    apiFetch(`/messages?matchId=${encodeURIComponent(match.matchId)}`, idToken)
      .then((r) => r.json())
      .then(async (data: Message[]) => {
        setMessages(data);
        await markMatchSeen(match.matchId);
      })
      .catch(() => {});
  }, [idToken, match.matchId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const send = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    const text = content.trim();
    setContent("");
    try {
      await apiFetch("/messages", idToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.matchId, content: text }),
      });
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.threadContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.threadHeader}>
          <Pressable onPress={onBack} style={s.iconButton}>
            <ArrowLeft size={18} color={colors.textMuted} />
          </Pressable>
          <View
            style={[styles.threadAvatar, { backgroundColor: match.profile.color }]}
          >
            <Text style={styles.threadAvatarText}>{match.profile.initials}</Text>
          </View>
          <Text style={styles.threadName}>{match.profile.name}</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(m) => m.createdAt}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            messages === null ? (
              <Text style={[s.mutedText, styles.centerText]}>Loading…</Text>
            ) : (
              <Text style={[s.mutedText, styles.centerText]}>
                Say hello to {match.profile.name.split(" ")[0]}.
              </Text>
            )
          }
          renderItem={({ item: m }) => {
            const mine = m.senderId === user?.sub;
            return (
              <View
                style={[
                  styles.messageRow,
                  { justifyContent: mine ? "flex-end" : "flex-start" },
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    mine ? styles.bubbleMine : styles.bubbleTheirs,
                  ]}
                >
                  <Text
                    style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Message…"
            placeholderTextColor={colors.textFaint}
            style={styles.composerInput}
          />
          <Pressable
            onPress={send}
            disabled={!content.trim() || sending}
            style={[
              styles.sendButton,
              (!content.trim() || sending) && s.disabled,
            ]}
          >
            <Send size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerText: {
    marginTop: 40,
    textAlign: "center",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  matchSubtitle: {
    fontSize: 12,
    color: colors.textDim,
  },
  unreadDot: {
    height: 10,
    width: 10,
    borderRadius: 999,
    backgroundColor: colors.pink,
  },
  threadContainer: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  threadAvatar: {
    height: 36,
    width: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  threadAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  threadName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  messageRow: {
    flexDirection: "row",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: colors.pink,
  },
  bubbleTheirs: {
    backgroundColor: colors.surfaceAlt,
  },
  bubbleTextMine: {
    fontSize: 14,
    color: "#fff",
  },
  bubbleTextTheirs: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  composerInput: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendButton: {
    height: 40,
    width: 40,
    borderRadius: 999,
    backgroundColor: colors.pink,
    alignItems: "center",
    justifyContent: "center",
  },
});
