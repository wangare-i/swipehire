import type { MatchSummary } from "./types";

const STORAGE_KEY = "ajiraswipe_chat_seen";
const SEEN_UPDATED_EVENT = "chat-seen-updated";

type SeenMap = Record<string, string>;

function readSeen(): SeenMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markMatchSeen(matchId: string) {
  const seen = readSeen();
  seen[matchId] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  window.dispatchEvent(new Event(SEEN_UPDATED_EVENT));
}

export function onChatSeenUpdated(callback: () => void) {
  window.addEventListener(SEEN_UPDATED_EVENT, callback);
  return () => window.removeEventListener(SEEN_UPDATED_EVENT, callback);
}

export function isMatchUnread(match: MatchSummary): boolean {
  const seen = readSeen();
  const activity = match.lastMessageAt ?? match.matchedAt;
  const seenAt = seen[match.matchId];
  return !!activity && (!seenAt || activity > seenAt);
}

export function countUnread(matches: MatchSummary[]): number {
  return matches.filter(isMatchUnread).length;
}
