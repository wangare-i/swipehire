import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Flame } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch {
      setError("Couldn't sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.authScreen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.authBrand}>
        <Flame color={colors.pink} size={32} fill={colors.pink} />
        <Text style={s.authBrandText}>AjiraSwipe</Text>
      </View>

      <View style={s.authForm}>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textFaint}
          value={email}
          onChangeText={setEmail}
          style={s.input}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.textFaint}
          value={password}
          onChangeText={setPassword}
          style={s.input}
        />
        {error && <Text style={s.errorText}>{error}</Text>}
        <Pressable
          onPress={submit}
          disabled={loading || !email || !password}
          style={[s.primaryButton, (loading || !email || !password) && s.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryButtonText}>Sign In</Text>
          )}
        </Pressable>
        <Link href="/forgot-password" style={s.linkMuted}>
          Forgot password?
        </Link>
      </View>

      <View style={styles.footer}>
        <Text style={s.mutedText}>New here? </Text>
        <Link href="/signup" style={s.linkBold}>
          Create an account
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
  },
});
