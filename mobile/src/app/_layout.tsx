import "@/lib/polyfills";

import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";

const PUBLIC_SEGMENTS = ["login", "signup", "forgot-password"];

function RootNavigator() {
  const { user, idToken, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_SEGMENTS.includes(segments[0] ?? "");

  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    // Syncing with idToken changing (login, logout, session restore) — same
    // accepted pattern as the web app's AuthGate.
    if (!idToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasProfile(null);
      return;
    }
    apiFetch("/profile", idToken)
      .then((r) => setHasProfile(r.ok))
      .catch(() => setHasProfile(null));
  }, [idToken]);

  const profileChecked = !user || hasProfile !== null;

  useEffect(() => {
    if (loading || !profileChecked) return;
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && isPublic) {
      router.replace("/");
      return;
    }
    if (user && hasProfile === false && pathname !== "/profile") {
      router.replace("/profile");
    }
  }, [user, loading, isPublic, hasProfile, profileChecked, pathname, router]);

  if (loading || (user && !profileChecked)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.pink} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
