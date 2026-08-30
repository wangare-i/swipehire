"use client";

import { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/lib/types";

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

export default function ProfilePage() {
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 pt-6 pb-8">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="text-pink-500" size={24} />
          <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="rounded-full bg-neutral-900 p-2 text-neutral-400 hover:text-neutral-200"
        >
          <LogOut size={16} />
        </button>
      </header>

      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {isRecruiter ? "Recruiter" : "Job seeker"} · {user?.email}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="How can people reach you?">
          <input
            required
            placeholder="Email, phone, LinkedIn…"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label={isRecruiter ? "Your title" : "Current / desired title"}>
          <input
            placeholder={isRecruiter ? "Technical Recruiter" : "Frontend Engineer"}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
        </Field>

        {isRecruiter ? (
          <>
            <Field label="Company">
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Specialties (comma separated)">
              <input
                placeholder="Frontend, Design, Startups"
                value={form.specialties}
                onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Skills (comma separated)">
              <input
                placeholder="React, TypeScript, Figma"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                className={inputClass}
              />
            </Field>
          </>
        )}

        <Field label="Bio">
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-pink-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-400">{label}</span>
      {children}
    </label>
  );
}
