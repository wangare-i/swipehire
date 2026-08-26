"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Heart, Users, MessageCircle } from "lucide-react";

const TABS = [
  { href: "/", label: "Discover", icon: Flame },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/connections", label: "Network", icon: Users },
  { href: "/feed", label: "Feed", icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-neutral-950/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition-colors ${
                active ? "text-pink-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                fill={active ? "currentColor" : "none"}
              />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
