"use client";

import { useEffect, useState } from "react";
import { Heart, Plus, Briefcase } from "lucide-react";
import type { Job, Swipe, ApplicationStatus } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import JobStatusChart from "@/components/JobStatusChart";

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
    <div className="flex flex-col px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <Heart className="text-pink-500" size={24} fill="currentColor" />
        <h1 className="text-xl font-extrabold tracking-tight">Matches</h1>
      </header>

      {matches && matches.length > 0 && (
        <JobStatusChart statuses={matches.map((m) => m.swipe.status ?? "matched")} />
      )}

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="flex flex-col px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="text-pink-500" size={24} />
          <h1 className="text-xl font-extrabold tracking-tight">My Jobs</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 rounded-full bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus size={14} />
          Post a job
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-5 flex flex-col gap-2 rounded-2xl bg-neutral-900 p-4"
        >
          <input
            required
            placeholder="Job title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none"
          />
          <input
            required
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none"
          />
          <input
            required
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none"
          />
          <input
            required
            placeholder="Salary (e.g. $120k – $150k)"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none"
          />
          <textarea
            required
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="resize-none rounded-lg bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none"
          />
          <input
            placeholder="Tags, comma separated (React, Remote-friendly)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
            />
            Remote
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-1 rounded-full bg-pink-500 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? "Posting…" : "Post job"}
          </button>
        </form>
      )}

      {jobs === null ? (
        <p className="mt-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <Briefcase size={40} className="text-neutral-700" />
          <p className="text-sm text-neutral-500">
            You haven&apos;t posted any jobs yet.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-2xl bg-neutral-900 p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">{job.company}</p>
              <h3 className="font-bold">{job.title}</h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                {job.location}
                {job.remote ? " · Remote" : ""} · {job.salary}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
