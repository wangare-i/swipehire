"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Heart, Send } from "lucide-react";
import type { Post } from "@/lib/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  const submit = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: "You", content }),
      });
      if (!res.ok) throw new Error("Failed to post");
      const post = (await res.json()) as Post;
      setPosts((prev) => (prev ? [post, ...prev] : [post]));
      setContent("");
    } catch {
      setError("Couldn't post right now. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const like = async (postId: string) => {
    setPosts(
      (prev) =>
        prev?.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)) ??
        null
    );
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
  };

  return (
    <div className="flex flex-col px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <MessageCircle className="text-pink-500" size={24} />
        <h1 className="text-xl font-extrabold tracking-tight">Feed</h1>
      </header>

      <div className="mb-5 rounded-2xl bg-neutral-900 p-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share a tip, a win, or what you're job hunting for…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm placeholder:text-neutral-600 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          {error ? <p className="text-xs text-red-400">{error}</p> : <span />}
          <button
            onClick={submit}
            disabled={!content.trim() || posting}
            className="flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Send size={14} />
            Post
          </button>
        </div>
      </div>

      {posts === null ? (
        <p className="text-center text-sm text-neutral-500">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-500">
          No posts yet. Be the first to share something.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-2xl bg-neutral-900 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-xs font-bold text-white">
                  {post.author.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{post.author}</p>
                  <p className="text-[11px] text-neutral-500">
                    {timeAgo(post.createdAt)}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-300">
                {post.content}
              </p>
              <button
                onClick={() => like(post.id)}
                className="mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-pink-500"
              >
                <Heart size={14} />
                {post.likes}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
