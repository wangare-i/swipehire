import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Flame, Heart, MessageSquare, MessageCircle, User } from "lucide-react-native";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { countUnread, onChatSeenUpdated } from "@/lib/chatSeen";
import { colors } from "@/lib/colors";
import type { MatchSummary } from "@/lib/types";

const POLL_MS = 15000;

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { idToken, user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;
    const refresh = () => {
      apiFetch("/matches", idToken)
        .then((r) => r.json())
        .then((matches: MatchSummary[]) => countUnread(matches))
        .then((count) => {
          if (!cancelled) setUnread(count);
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const unsubscribe = onChatSeenUpdated(refresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [idToken]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: "rgba(255,255,255,0.1)",
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Flame color={color} size={21} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: user?.role === "recruiter" ? "My Jobs" : "Matches",
          tabBarIcon: ({ color }) => <Heart color={color} size={21} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <View>
              <MessageSquare color={color} size={21} />
              <Badge count={unread} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={21} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.pink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
});
