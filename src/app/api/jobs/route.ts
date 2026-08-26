import { NextResponse } from "next/server";
import { getAllJobs, getAllSwipes } from "@/lib/db";

export async function GET() {
  const [jobs, swipes] = await Promise.all([getAllJobs(), getAllSwipes()]);
  const swipedIds = new Set(
    swipes.filter((s) => s.targetType === "job").map((s) => s.targetId)
  );
  const deck = jobs.filter((j) => !swipedIds.has(j.id));
  return NextResponse.json(deck);
}
