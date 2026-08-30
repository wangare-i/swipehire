"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Heart, MessageSquare, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = [
    { href: "/", label: "Discover", icon: Flame },
    {
      href: "/matches",
      label: user?.role === "recruiter" ? "My Jobs" : "Matches",
      icon: Heart,
    },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/feed", label: "Feed", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-neutral-950/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors ${
                active ? "text-pink-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon
                size={21}
                strokeWidth={active ? 2.5 : 2}
                fill={active ? "currentColor" : "none"}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
