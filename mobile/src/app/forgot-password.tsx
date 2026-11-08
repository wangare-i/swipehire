import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Flame } from "lucide-react-native";
import { forgotPassword, confirmForgotPassword } from "@/lib/auth";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("confirm");
    } catch {
      setError("Couldn't send a reset code. Check the email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    setError(null);
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      router.replace("/login");
    } catch {
      setError("That code didn't work, or the new password is too weak.");
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

      {step === "request" ? (
        <View style={s.authForm}>
          <Text style={s.mutedText}>
            Enter your email and we&apos;ll send a reset code.
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            style={s.input}
          />
          {error && <Text style={s.errorText}>{error}</Text>}
          <Pressable
            onPress={requestCode}
            disabled={loading || !email}
            style={[s.primaryButton, (loading || !email) && s.disabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryButtonText}>Send reset code</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={s.authForm}>
          <Text style={s.mutedText}>
            Check your email for a code, then set a new password.
          </Text>
          <TextInput
            placeholder="Reset code"
            placeholderTextColor={colors.textFaint}
            value={code}
            onChangeText={setCode}
            style={s.input}
          />
          <TextInput
            secureTextEntry
            placeholder="New password"
            placeholderTextColor={colors.textFaint}
            value={newPassword}
            onChangeText={setNewPassword}
            style={s.input}
          />
          {error && <Text style={s.errorText}>{error}</Text>}
          <Pressable
            onPress={confirmReset}
            disabled={loading || !code || !newPassword}
            style={[
              s.primaryButton,
              (loading || !code || !newPassword) && s.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryButtonText}>Reset password</Text>
            )}
          </Pressable>
        </View>
      )}

      <Link href="/login" style={[s.linkBold, { marginTop: 24 }]}>
        Back to sign in
      </Link>
    </KeyboardAvoidingView>
  );
}
