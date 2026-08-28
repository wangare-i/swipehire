"use client";

import { useEffect, useState } from "react";
import { Flame, Briefcase, Users2, LogOut } from "lucide-react";
import SwipeDeck from "@/components/SwipeDeck";
import JobCard from "@/components/JobCard";
import RecruiterCard from "@/components/RecruiterCard";
import type { Job, Recruiter } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Mode = "jobs" | "recruiters";

export default function DiscoverPage() {
  const { idToken, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("jobs");
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [recruiters, setRecruiters] = useState<Recruiter[] | null>(null);

  useEffect(() => {
    apiFetch("/jobs", idToken)
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => setJobs([]));
    apiFetch("/recruiters", idToken)
      .then((r) => r.json())
      .then(setRecruiters)
      .catch(() => setRecruiters([]));
  }, [idToken]);

  const swipe = async (
    targetType: "job" | "recruiter",
    targetId: string,
    direction: "like" | "pass"
  ) => {
    await apiFetch("/swipes", idToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, direction }),
    });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="text-pink-500" size={26} fill="currentColor" />
          <h1 className="text-xl font-extrabold tracking-tight">AjiraSwipe</h1>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} setMode={setMode} />
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-full bg-neutral-900 p-2 text-neutral-400 hover:text-neutral-200"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {mode === "jobs" ? (
          jobs === null ? (
            <Loading />
          ) : (
            <SwipeDeck
              items={jobs}
              renderCard={(job) => <JobCard job={job} />}
              onSwipe={(job, direction) => {
                setJobs((prev) => prev?.filter((j) => j.id !== job.id) ?? null);
                swipe("job", job.id, direction);
              }}
              emptyState={
                <EmptyState
                  icon={<Briefcase size={40} className="text-pink-500" />}
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
            renderCard={(r) => <RecruiterCard recruiter={r} />}
            onSwipe={(r, direction) => {
              setRecruiters(
                (prev) => prev?.filter((x) => x.id !== r.id) ?? null
              );
              swipe("recruiter", r.id, direction);
            }}
            emptyState={
              <EmptyState
                icon={<Users2 size={40} className="text-pink-500" />}
                title="No more recruiters"
                subtitle="You've seen everyone in the deck. Check back later."
              />
            }
          />
        )}
      </div>
    </div>
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
    <div className="flex rounded-full bg-neutral-900 p-1 text-sm font-semibold">
      <button
        onClick={() => setMode("jobs")}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          mode === "jobs" ? "bg-pink-500 text-white" : "text-neutral-400"
        }`}
      >
        Jobs
      </button>
      <button
        onClick={() => setMode("recruiters")}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          mode === "recruiters" ? "bg-pink-500 text-white" : "text-neutral-400"
        }`}
      >
        Recruiters
      </button>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Loading deck…
    </div>
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
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      {icon}
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="max-w-xs text-sm text-neutral-500">{subtitle}</p>
    </div>
  );
}
