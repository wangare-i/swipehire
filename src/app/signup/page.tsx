"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/auth";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("jobseeker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 flex items-center gap-2">
        <Flame className="text-pink-500" size={32} fill="currentColor" />
        <h1 className="text-2xl font-extrabold">AjiraSwipe</h1>
      </div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="flex rounded-full bg-neutral-900 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setRole("jobseeker")}
            className={`flex-1 rounded-full py-2 transition-colors ${
              role === "jobseeker" ? "bg-pink-500 text-white" : "text-neutral-400"
            }`}
          >
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setRole("recruiter")}
            className={`flex-1 rounded-full py-2 transition-colors ${
              role === "recruiter" ? "bg-pink-500 text-white" : "text-neutral-400"
            }`}
          >
            Recruiter
          </button>
        </div>
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-pink-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-pink-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}
