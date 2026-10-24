"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { forgotPassword, confirmForgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 flex items-center gap-2">
        <Flame className="text-pink-500" size={32} fill="currentColor" />
        <h1 className="text-2xl font-extrabold">AjiraSwipe</h1>
      </div>

      {step === "request" ? (
        <form onSubmit={requestCode} className="w-full max-w-sm space-y-4">
          <p className="text-sm text-neutral-400">
            Enter your email and we&apos;ll send a reset code.
          </p>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pink-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmReset} className="w-full max-w-sm space-y-4">
          <p className="text-sm text-neutral-400">
            Check your email for a code, then set a new password.
          </p>
          <input
            type="text"
            required
            placeholder="Reset code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="password"
            required
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pink-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-neutral-500">
        <Link href="/login" className="font-semibold text-pink-500">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
