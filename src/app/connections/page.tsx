"use client";

import { useEffect, useState } from "react";
import { Users2 } from "lucide-react";
import type { Recruiter, Swipe } from "@/lib/types";
import { API_BASE } from "@/lib/api";

type Connection = { swipe: Swipe; recruiter: Recruiter };

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[] | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/matches/recruiters`)
      .then((r) => r.json())
      .then(setConnections)
      .catch(() => setConnections([]));
  }, []);

  return (
    <div className="flex flex-col px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <Users2 className="text-pink-500" size={24} />
        <h1 className="text-xl font-extrabold tracking-tight">Network</h1>
      </header>

      {connections === null ? (
        <p className="mt-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : connections.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <Users2 size={40} className="text-neutral-700" />
          <p className="text-sm text-neutral-500">
            No connections yet. Swipe right on a recruiter in Discover.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {connections.map(({ swipe, recruiter }) => (
            <li
              key={swipe.id}
              className="flex items-center gap-3 rounded-2xl bg-neutral-900 p-4 shadow-sm"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${recruiter.color}, #0a0a0a)`,
                }}
              >
                {recruiter.initials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-bold">{recruiter.name}</h3>
                <p className="truncate text-xs text-neutral-500">
                  {recruiter.title} @ {recruiter.company}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
