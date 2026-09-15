"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isMatchUnread, markMatchSeen } from "@/lib/chatSeen";
import type { MatchSummary, Message } from "@/lib/types";

const POLL_MS = 3000;

export default function ChatPage() {
  const { idToken } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [active, setActive] = useState<MatchSummary | null>(null);

  useEffect(() => {
    apiFetch("/matches", idToken)
      .then((r) => r.json())
      .then((data: MatchSummary[]) => {
        const sorted = [...data].sort((a, b) =>
          (b.lastMessageAt ?? b.matchedAt).localeCompare(a.lastMessageAt ?? a.matchedAt)
        );
        setMatches(sorted);
      })
      .catch(() => setMatches([]));
  }, [idToken]);

  if (active) {
    return (
      <Thread
        match={active}
        onBack={() => {
          setActive(null);
          setMatches((prev) => (prev ? [...prev] : prev));
        }}
      />
    );
  }

  return (
    <div className="flex flex-col px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <MessageSquare className="text-pink-500" size={24} />
        <h1 className="text-xl font-extrabold tracking-tight">Chat</h1>
      </header>

      {matches === null ? (
        <p className="mt-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : matches.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <MessageSquare size={40} className="text-neutral-700" />
          <p className="text-sm text-neutral-500">
            No matches yet. Mutual likes in Discover show up here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => {
            const unread = isMatchUnread(m);
            return (
              <li key={m.matchId}>
                <button
                  onClick={() => {
                    markMatchSeen(m.matchId);
                    setActive(m);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-neutral-900 p-4 text-left shadow-sm"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${m.profile.color}, #0a0a0a)`,
                    }}
                  >
                    {m.profile.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{m.profile.name}</h3>
                    <p className="truncate text-xs text-neutral-500">
                      {m.profile.title}
                      {m.profile.company ? ` @ ${m.profile.company}` : ""}
                    </p>
                  </div>
                  {unread && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-pink-500" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Thread({
  match,
  onBack,
}: {
  match: MatchSummary;
  onBack: () => void;
}) {
  const { idToken, user } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiFetch(`/messages?matchId=${encodeURIComponent(match.matchId)}`, idToken)
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data);
        markMatchSeen(match.matchId);
      })
      .catch(() => {});
  }, [idToken, match.matchId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    const text = content.trim();
    setContent("");
    try {
      await apiFetch("/messages", idToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.matchId, content: text }),
      });
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col px-4 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="rounded-full bg-neutral-900 p-2 text-neutral-400 hover:text-neutral-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${match.profile.color}, #0a0a0a)`,
          }}
        >
          {match.profile.initials}
        </div>
        <h1 className="font-bold">{match.profile.name}</h1>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
        {messages === null ? (
          <p className="text-center text-sm text-neutral-500">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-500">
            Say hello to {match.profile.name.split(" ")[0]}.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.sub;
            return (
              <div
                key={m.createdAt}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-pink-500 text-white"
                      : "bg-neutral-800 text-neutral-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 py-3">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full bg-neutral-900 px-4 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          aria-label="Send"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
