"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { Job, Swipe, ApplicationStatus } from "@/lib/types";
import { API_BASE } from "@/lib/api";

type Match = { swipe: Swipe; job: Job };

const STATUSES: ApplicationStatus[] = [
  "matched",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  matched: "bg-pink-500/15 text-pink-400",
  applied: "bg-blue-500/15 text-blue-400",
  interviewing: "bg-amber-500/15 text-amber-400",
  offer: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-neutral-500/15 text-neutral-400",
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/matches/jobs`)
      .then((r) => r.json())
      .then(setMatches)
      .catch(() => setMatches([]));
  }, []);

  const updateStatus = async (swipeId: string, status: ApplicationStatus) => {
    setMatches(
      (prev) =>
        prev?.map((m) =>
          m.swipe.id === swipeId ? { ...m, swipe: { ...m.swipe, status } } : m
        ) ?? null
    );
    await fetch(`${API_BASE}/matches/jobs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swipeId, status }),
    });
  };

  return (
    <div className="flex flex-col px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <Heart className="text-pink-500" size={24} fill="currentColor" />
        <h1 className="text-xl font-extrabold tracking-tight">Matches</h1>
      </header>

      {matches === null ? (
        <p className="mt-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : matches.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <Heart size={40} className="text-neutral-700" />
          <p className="text-sm text-neutral-500">
            No matches yet. Swipe right on a job in Discover.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map(({ swipe, job }) => (
            <li
              key={swipe.id}
              className="rounded-2xl bg-neutral-900 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    {job.company}
                  </p>
                  <h3 className="font-bold">{job.title}</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {job.location}
                    {job.remote ? " · Remote" : ""} · {job.salary}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    STATUS_STYLES[swipe.status ?? "matched"]
                  }`}
                >
                  {swipe.status ?? "matched"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(swipe.id, s)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                      swipe.status === s
                        ? "bg-pink-500 text-white"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
