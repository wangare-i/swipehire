import { NextResponse } from "next/server";
import { createPost, getAllPosts, likePost } from "@/lib/db";

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const { author, content } = (await req.json()) as {
    author: string;
    content: string;
  };
  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  const post = await createPost(author?.trim() || "You", content.trim());
  return NextResponse.json(post);
}

export async function PATCH(req: Request) {
  const { postId } = (await req.json()) as { postId: string };
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  await likePost(postId);
  return NextResponse.json({ ok: true });
}
