"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">
        {children}
      </main>
      {user && <BottomNav />}
    </>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGate>
        <Shell>{children}</Shell>
      </AuthGate>
    </AuthProvider>
  );
}
