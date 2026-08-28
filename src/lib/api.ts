export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function apiFetch(
  path: string,
  idToken: string | null,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);
  if (idToken) headers.set("Authorization", `Bearer ${idToken}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
