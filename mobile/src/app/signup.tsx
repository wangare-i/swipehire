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
import type { Role } from "@/lib/auth";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("jobseeker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      router.replace("/");
    } catch {
      setError(
        "Couldn't create your account. Try a different email or a stronger password (8+ characters)."
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name && email && password.length >= 8 && !loading;

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
        <View style={styles.roleToggle}>
          <Pressable
            onPress={() => setRole("jobseeker")}
            style={[
              styles.roleButton,
              role === "jobseeker" && styles.roleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "jobseeker" && styles.roleButtonTextActive,
              ]}
            >
              Job Seeker
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole("recruiter")}
            style={[
              styles.roleButton,
              role === "recruiter" && styles.roleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "recruiter" && styles.roleButtonTextActive,
              ]}
            >
              Recruiter
            </Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Full name"
          placeholderTextColor={colors.textFaint}
          value={name}
          onChangeText={setName}
          style={s.input}
        />
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
          disabled={!canSubmit}
          style={[s.primaryButton, !canSubmit && s.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryButtonText}>Sign Up</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={s.mutedText}>Already have an account? </Text>
        <Link href="/login" style={s.linkBold}>
          Sign in
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
  roleToggle: {
    flexDirection: "row",
    borderRadius: 999,
    backgroundColor: colors.surface,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: colors.pink,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  roleButtonTextActive: {
    color: "#fff",
  },
});
