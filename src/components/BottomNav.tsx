"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Heart, MessageSquare, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { countUnread, onChatSeenUpdated } from "@/lib/chatSeen";
import type { MatchSummary } from "@/lib/types";

const POLL_MS = 15000;

export default function BottomNav() {
  const pathname = usePathname();
  const { idToken, user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!idToken) return;

    let cancelled = false;
    const refresh = () => {
      apiFetch("/matches", idToken)
        .then((r) => r.json())
        .then((matches: MatchSummary[]) => {
          if (!cancelled) setUnread(countUnread(matches));
        })
        .catch(() => {});
    };

    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const unsubscribe = onChatSeenUpdated(refresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [idToken]);

  const tabs = [
    { href: "/", label: "Discover", icon: Flame, badge: 0 },
    {
      href: "/matches",
      label: user?.role === "recruiter" ? "My Jobs" : "Matches",
      icon: Heart,
      badge: 0,
    },
    { href: "/chat", label: "Chat", icon: MessageSquare, badge: unread },
    { href: "/feed", label: "Feed", icon: MessageCircle, badge: 0 },
    { href: "/profile", label: "Profile", icon: User, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-neutral-950/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-2">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors ${
                active ? "text-pink-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <span className="relative">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 2}
                  fill={active ? "currentColor" : "none"}
                />
                {badge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
