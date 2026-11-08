import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, Briefcase, Users2, LogOut } from "lucide-react-native";
import SwipeDeck from "@/components/SwipeDeck";
import JobCard from "@/components/JobCard";
import ProfileCard from "@/components/ProfileCard";
import type { Job, Profile } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/lib/colors";
import { sharedStyles as s } from "@/lib/sharedStyles";

type Mode = "jobs" | "recruiters";

export default function DiscoverScreen() {
  const { idToken, user, signOut } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  const [mode, setMode] = useState<Mode>("jobs");
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [recruiters, setRecruiters] = useState<Profile[] | null>(null);
  const [candidates, setCandidates] = useState<Profile[] | null>(null);

  useEffect(() => {
    if (!idToken) return;
    if (isRecruiter) {
      apiFetch("/candidates", idToken)
        .then((r) => r.json())
        .then(setCandidates)
        .catch(() => setCandidates([]));
    } else {
      apiFetch("/jobs", idToken)
        .then((r) => r.json())
        .then(setJobs)
        .catch(() => setJobs([]));
      apiFetch("/recruiters", idToken)
        .then((r) => r.json())
        .then(setRecruiters)
        .catch(() => setRecruiters([]));
    }
  }, [idToken, isRecruiter]);

  const swipeJob = async (job: Job, direction: "like" | "pass") => {
    setJobs((prev) => prev?.filter((j) => j.id !== job.id) ?? null);
    await apiFetch("/swipes", idToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "job", targetId: job.id, direction }),
    });
  };

  const swipeProfile = async (
    profile: Profile,
    direction: "like" | "pass",
    onDeck: React.Dispatch<React.SetStateAction<Profile[] | null>>
  ) => {
    onDeck((prev) => prev?.filter((p) => p.userId !== profile.userId) ?? null);
    const res = await apiFetch("/swipes", idToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "profile",
        targetId: profile.userId,
        direction,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.matched;
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.screenHeader}>
        <View style={s.headerLeft}>
          <Flame color={colors.pink} size={26} fill={colors.pink} />
          <Text style={s.headerTitle}>AjiraSwipe</Text>
        </View>
        <View style={styles.headerRight}>
          {!isRecruiter && <ModeToggle mode={mode} setMode={setMode} />}
          <Pressable onPress={signOut} style={s.iconButton}>
            <LogOut size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.deckArea}>
        {isRecruiter ? (
          candidates === null ? (
            <Loading />
          ) : (
            <SwipeDeck
              items={candidates}
              getKey={(p) => p.userId}
              renderCard={(p) => <ProfileCard profile={p} />}
              onSwipe={(p, direction) => swipeProfile(p, direction, setCandidates)}
              emptyState={
                <EmptyState
                  icon={<Users2 size={40} color={colors.pink} />}
                  title="No more candidates"
                  subtitle="You've seen everyone in the deck. Check back later."
                />
              }
            />
          )
        ) : mode === "jobs" ? (
          jobs === null ? (
            <Loading />
          ) : (
            <SwipeDeck
              items={jobs}
              getKey={(job) => job.id}
              renderCard={(job) => <JobCard job={job} />}
              onSwipe={swipeJob}
              emptyState={
                <EmptyState
                  icon={<Briefcase size={40} color={colors.pink} />}
                  title="You're all caught up"
                  subtitle="No more jobs in the deck right now. Check back later."
                />
              }
            />
          )
        ) : recruiters === null ? (
          <Loading />
        ) : (
          <SwipeDeck
            items={recruiters}
            getKey={(p) => p.userId}
            renderCard={(p) => <ProfileCard profile={p} />}
            onSwipe={(p, direction) => swipeProfile(p, direction, setRecruiters)}
            emptyState={
              <EmptyState
                icon={<Users2 size={40} color={colors.pink} />}
                title="No more recruiters"
                subtitle="You've seen everyone in the deck. Check back later."
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Pressable
        onPress={() => setMode("jobs")}
        style={[styles.toggleButton, mode === "jobs" && styles.toggleButtonActive]}
      >
        <Text
          style={[
            styles.toggleButtonText,
            mode === "jobs" && styles.toggleButtonTextActive,
          ]}
        >
          Jobs
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setMode("recruiters")}
        style={[
          styles.toggleButton,
          mode === "recruiters" && styles.toggleButtonActive,
        ]}
      >
        <Text
          style={[
            styles.toggleButtonText,
            mode === "recruiters" && styles.toggleButtonTextActive,
          ]}
        >
          Recruiters
        </Text>
      </Pressable>
    </View>
  );
}

function Loading() {
  return (
    <View style={s.centeredLoading}>
      <Text style={s.mutedText}>Loading deck…</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={s.emptyState}>
      {icon}
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deckArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  toggle: {
    flexDirection: "row",
    borderRadius: 999,
    backgroundColor: colors.surface,
    padding: 4,
  },
  toggleButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.pink,
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
});
