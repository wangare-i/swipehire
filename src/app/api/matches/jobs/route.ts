import { NextResponse } from "next/server";
import { getAllJobs, getAllSwipes, updateSwipeStatus } from "@/lib/db";
import type { ApplicationStatus } from "@/lib/types";

export async function GET() {
  const [jobs, swipes] = await Promise.all([getAllJobs(), getAllSwipes()]);
  const jobsById = new Map(jobs.map((j) => [j.id, j]));

  const matches = swipes
    .filter((s) => s.targetType === "job" && s.direction === "like")
    .map((s) => ({ swipe: s, job: jobsById.get(s.targetId) }))
    .filter((m) => m.job)
    .sort((a, b) => b.swipe.createdAt.localeCompare(a.swipe.createdAt));

  return NextResponse.json(matches);
}

export async function PATCH(req: Request) {
  const { swipeId, status } = (await req.json()) as {
    swipeId: string;
    status: ApplicationStatus;
  };
  if (!swipeId || !status) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  await updateSwipeStatus(swipeId, status);
  return NextResponse.json({ ok: true });
}
