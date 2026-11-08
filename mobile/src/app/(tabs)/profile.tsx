import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, LogOut } from "lucide-react-native";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/lib/types";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

type FormState = {
  name: string;
  contact: string;
  bio: string;
  title: string;
  location: string;
  skills: string;
  company: string;
  specialties: string;
};

const emptyForm: FormState = {
  name: "",
  contact: "",
  bio: "",
  title: "",
  location: "",
  skills: "",
  company: "",
  specialties: "",
};

export default function ProfileScreen() {
  const { idToken, user, signOut } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    name: user?.name || "",
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    apiFetch("/profile", idToken)
      .then(async (r) => {
        if (r.status === 404) return null;
        return (await r.json()) as Profile;
      })
      .then((profile) => {
        if (profile) {
          setForm({
            name: profile.name || "",
            contact: profile.contact || "",
            bio: profile.bio || "",
            title: profile.title || "",
            location: profile.location || "",
            skills: (profile.skills || []).join(", "),
            company: profile.company || "",
            specialties: (profile.specialties || []).join(", "),
          });
        }
      })
      .finally(() => setLoaded(true));
  }, [idToken]);

  const submit = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const body = isRecruiter
        ? {
            name: form.name,
            contact: form.contact,
            bio: form.bio,
            title: form.title,
            company: form.company,
            specialties: form.specialties
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : {
            name: form.name,
            contact: form.contact,
            bio: form.bio,
            title: form.title,
            location: form.location,
            skills: form.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };

      const res = await apiFetch("/profile", idToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      setSaved(true);
    } catch {
      setError("Couldn't save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <SafeAreaView style={s.centeredLoading} edges={["top"]}>
        <Text style={s.mutedText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.screenHeader}>
        <View style={s.headerLeft}>
          <User color={colors.pink} size={24} />
          <Text style={s.headerTitle}>Profile</Text>
        </View>
        <Pressable onPress={signOut} style={s.iconButton}>
          <LogOut size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.formScroll}>
        <Text style={styles.roleLine}>
          {isRecruiter ? "Recruiter" : "Job seeker"} · {user?.email}
        </Text>

        <Field label="Name">
          <TextInput
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            style={styles.input}
          />
        </Field>

        <Field label="How can people reach you?">
          <TextInput
            placeholder="Email, phone, LinkedIn…"
            placeholderTextColor={colors.textFaint}
            value={form.contact}
            onChangeText={(v) => setForm({ ...form, contact: v })}
            style={styles.input}
          />
        </Field>

        <Field label={isRecruiter ? "Your title" : "Current / desired title"}>
          <TextInput
            placeholder={isRecruiter ? "Technical Recruiter" : "Frontend Engineer"}
            placeholderTextColor={colors.textFaint}
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
            style={styles.input}
          />
        </Field>

        {isRecruiter ? (
          <>
            <Field label="Company">
              <TextInput
                value={form.company}
                onChangeText={(v) => setForm({ ...form, company: v })}
                style={styles.input}
              />
            </Field>
            <Field label="Specialties (comma separated)">
              <TextInput
                placeholder="Frontend, Design, Startups"
                placeholderTextColor={colors.textFaint}
                value={form.specialties}
                onChangeText={(v) => setForm({ ...form, specialties: v })}
                style={styles.input}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Location">
              <TextInput
                value={form.location}
                onChangeText={(v) => setForm({ ...form, location: v })}
                style={styles.input}
              />
            </Field>
            <Field label="Skills (comma separated)">
              <TextInput
                placeholder="React, TypeScript, Figma"
                placeholderTextColor={colors.textFaint}
                value={form.skills}
                onChangeText={(v) => setForm({ ...form, skills: v })}
                style={styles.input}
              />
            </Field>
          </>
        )}

        <Field label="Bio">
          <TextInput
            value={form.bio}
            onChangeText={(v) => setForm({ ...form, bio: v })}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textarea]}
          />
        </Field>

        {error && <Text style={s.errorText}>{error}</Text>}
        {saved && <Text style={styles.savedText}>Saved.</Text>}

        <Pressable
          onPress={submit}
          disabled={saving}
          style={[s.primaryButton, styles.saveButton, saving && s.disabled]}
        >
          <Text style={s.primaryButtonText}>
            {saving ? "Saving…" : "Save profile"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  roleLine: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.textDim,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
  },
  input: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  savedText: {
    fontSize: 13,
    color: colors.emerald,
  },
  saveButton: {
    marginTop: 8,
  },
});
