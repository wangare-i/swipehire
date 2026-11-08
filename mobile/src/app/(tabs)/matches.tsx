import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Plus, Briefcase } from "lucide-react-native";
import type { Job, Swipe, ApplicationStatus } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import JobStatusChart from "@/components/JobStatusChart";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

type Match = { swipe: Swipe; job: Job };

const STATUSES: ApplicationStatus[] = [
  "matched",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  matched: colors.pink,
  applied: colors.blue,
  interviewing: colors.amber,
  offer: colors.emeraldDeep,
  rejected: colors.violet,
};

export default function MatchesScreen() {
  const { user } = useAuth();
  return user?.role === "recruiter" ? <RecruiterJobs /> : <JobSeekerMatches />;
}

function JobSeekerMatches() {
  const { idToken } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);

  useEffect(() => {
    apiFetch("/matches/jobs", idToken)
      .then((r) => r.json())
      .then(setMatches)
      .catch(() => setMatches([]));
  }, [idToken]);

  const updateStatus = async (swipeId: string, status: ApplicationStatus) => {
    setMatches(
      (prev) =>
        prev?.map((m) =>
          m.swipe.id === swipeId ? { ...m, swipe: { ...m.swipe, status } } : m
        ) ?? null
    );
    await apiFetch("/matches/jobs", idToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swipeId, status }),
    });
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.screenHeader}>
        <View style={s.headerLeft}>
          <Heart color={colors.pink} size={24} fill={colors.pink} />
          <Text style={s.headerTitle}>Matches</Text>
        </View>
      </View>

      <FlatList
        data={matches ?? []}
        keyExtractor={(m) => m.swipe.id}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          matches && matches.length > 0 ? (
            <JobStatusChart statuses={matches.map((m) => m.swipe.status ?? "matched")} />
          ) : undefined
        }
        ListEmptyComponent={
          matches === null ? (
            <Text style={[s.mutedText, styles.centerText]}>Loading…</Text>
          ) : (
            <View style={s.emptyState}>
              <Heart size={40} color={colors.textFaint} />
              <Text style={s.emptySubtitle}>
                No matches yet. Swipe right on a job in Discover.
              </Text>
            </View>
          )
        }
        renderItem={({ item: { swipe, job } }) => (
          <View style={s.card}>
            <View style={styles.matchRow}>
              <View style={styles.matchInfo}>
                <Text style={styles.company}>{job.company}</Text>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobMeta}>
                  {job.location}
                  {job.remote ? " · Remote" : ""} · {job.salary}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: STATUS_COLORS[swipe.status ?? "matched"] + "26" },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: STATUS_COLORS[swipe.status ?? "matched"] },
                  ]}
                >
                  {swipe.status ?? "matched"}
                </Text>
              </View>
            </View>
            <View style={styles.statusButtons}>
              {STATUSES.map((st) => {
                const active = swipe.status === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => updateStatus(swipe.id, st)}
                    style={[
                      styles.statusButton,
                      active && { backgroundColor: colors.pink },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        active && { color: "#fff" },
                      ]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const emptyForm = {
  title: "",
  company: "",
  location: "",
  salary: "",
  description: "",
  tags: "",
  remote: false,
};

function RecruiterJobs() {
  const { idToken } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiFetch("/jobs/mine", idToken)
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => setJobs([]));
  };

  useEffect(load, [idToken]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/jobs", idToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const job = (await res.json()) as Job;
      setJobs((prev) => (prev ? [job, ...prev] : [job]));
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setError("Couldn't post the job. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.screenHeader}>
        <View style={s.headerLeft}>
          <Briefcase color={colors.pink} size={24} />
          <Text style={s.headerTitle}>My Jobs</Text>
        </View>
        <Pressable onPress={() => setShowForm((v) => !v)} style={styles.postButton}>
          <Plus size={14} color="#fff" />
          <Text style={styles.postButtonText}>Post a job</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.listContent}>
        {showForm && (
          <View style={[s.card, styles.form]}>
            <TextInput
              placeholder="Job title"
              placeholderTextColor={colors.textFaint}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              style={styles.formInput}
            />
            <TextInput
              placeholder="Company"
              placeholderTextColor={colors.textFaint}
              value={form.company}
              onChangeText={(v) => setForm({ ...form, company: v })}
              style={styles.formInput}
            />
            <TextInput
              placeholder="Location"
              placeholderTextColor={colors.textFaint}
              value={form.location}
              onChangeText={(v) => setForm({ ...form, location: v })}
              style={styles.formInput}
            />
            <TextInput
              placeholder="Salary (e.g. $120k – $150k)"
              placeholderTextColor={colors.textFaint}
              value={form.salary}
              onChangeText={(v) => setForm({ ...form, salary: v })}
              style={styles.formInput}
            />
            <TextInput
              placeholder="Description"
              placeholderTextColor={colors.textFaint}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
              numberOfLines={3}
              style={[styles.formInput, styles.formTextarea]}
            />
            <TextInput
              placeholder="Tags, comma separated (React, Remote-friendly)"
              placeholderTextColor={colors.textFaint}
              value={form.tags}
              onChangeText={(v) => setForm({ ...form, tags: v })}
              style={styles.formInput}
            />
            <View style={styles.remoteRow}>
              <Text style={s.mutedText}>Remote</Text>
              <Switch
                value={form.remote}
                onValueChange={(v) => setForm({ ...form, remote: v })}
                trackColor={{ true: colors.pink }}
              />
            </View>
            {error && <Text style={s.errorText}>{error}</Text>}
            <Pressable
              onPress={submit}
              disabled={saving}
              style={[s.primaryButton, saving && s.disabled]}
            >
              <Text style={s.primaryButtonText}>
                {saving ? "Posting…" : "Post job"}
              </Text>
            </Pressable>
          </View>
        )}

        {jobs === null ? (
          <Text style={[s.mutedText, styles.centerText]}>Loading…</Text>
        ) : jobs.length === 0 ? (
          <View style={s.emptyState}>
            <Briefcase size={40} color={colors.textFaint} />
            <Text style={s.emptySubtitle}>You haven&apos;t posted any jobs yet.</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job.id} style={s.card}>
              <Text style={styles.company}>{job.company}</Text>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobMeta}>
                {job.location}
                {job.remote ? " · Remote" : ""} · {job.salary}
              </Text>
              <View style={styles.tagsRow}>
                {job.tags.map((t) => (
                  <View key={t} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    gap: 8,
  },
  matchInfo: {
    flex: 1,
  },
  company: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textDim,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  jobMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textDim,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusButtons: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusButton: {
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
    color: colors.textMuted,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: colors.pink,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  postButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  form: {
    gap: 8,
    marginBottom: 12,
  },
  formInput: {
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  formTextarea: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  remoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagChipText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
