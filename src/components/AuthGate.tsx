"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

const PUBLIC_PATHS = ["/login", "/signup"];

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, idToken, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetching profile completeness in response to the token changing (login,
    // logout, or a fresh session restore) — a standard "sync with an
    // external system on dependency change" effect.
    if (!idToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasProfile(null);
      return;
    }
    apiFetch("/profile", idToken)
      .then((r) => setHasProfile(r.ok))
      .catch(() => setHasProfile(null));
  }, [idToken]);

  const profileChecked = !user || hasProfile !== null;

  useEffect(() => {
    if (loading || !profileChecked) return;
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && isPublic) {
      router.replace("/");
      return;
    }
    if (user && hasProfile === false && pathname !== "/profile") {
      router.replace("/profile");
    }
  }, [user, loading, isPublic, hasProfile, profileChecked, pathname, router]);

  if (loading || (user && !profileChecked)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && isPublic) return null;
  if (user && hasProfile === false && pathname !== "/profile") return null;

  return <>{children}</>;
}
