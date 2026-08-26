import { NextResponse } from "next/server";
import { getAllRecruiters, getAllSwipes } from "@/lib/db";

export async function GET() {
  const [recruiters, swipes] = await Promise.all([
    getAllRecruiters(),
    getAllSwipes(),
  ]);
  const recruitersById = new Map(recruiters.map((r) => [r.id, r]));

  const matches = swipes
    .filter((s) => s.targetType === "recruiter" && s.direction === "like")
    .map((s) => ({ swipe: s, recruiter: recruitersById.get(s.targetId) }))
    .filter((m) => m.recruiter)
    .sort((a, b) => b.swipe.createdAt.localeCompare(a.swipe.createdAt));

  return NextResponse.json(matches);
}
