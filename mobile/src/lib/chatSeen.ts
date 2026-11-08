import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import type { MatchSummary } from "./types";

const STORAGE_KEY = "ajiraswipe_chat_seen";
const SEEN_UPDATED_EVENT = "chat-seen-updated";

type SeenMap = Record<string, string>;

async function readSeen(): Promise<SeenMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function markMatchSeen(matchId: string) {
  const seen = await readSeen();
  seen[matchId] = new Date().toISOString();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  DeviceEventEmitter.emit(SEEN_UPDATED_EVENT);
}

export function onChatSeenUpdated(callback: () => void) {
  const sub = DeviceEventEmitter.addListener(SEEN_UPDATED_EVENT, callback);
  return () => sub.remove();
}

export async function isMatchUnread(match: MatchSummary): Promise<boolean> {
  const seen = await readSeen();
  const activity = match.lastMessageAt ?? match.matchedAt;
  const seenAt = seen[match.matchId];
  return !!activity && (!seenAt || activity > seenAt);
}

export async function countUnread(matches: MatchSummary[]): Promise<number> {
  const results = await Promise.all(matches.map(isMatchUnread));
  return results.filter(Boolean).length;
}
