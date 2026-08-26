import { NextResponse } from "next/server";
import { getAllRecruiters, getAllSwipes } from "@/lib/db";

export async function GET() {
  const [recruiters, swipes] = await Promise.all([
    getAllRecruiters(),
    getAllSwipes(),
  ]);
  const swipedIds = new Set(
    swipes.filter((s) => s.targetType === "recruiter").map((s) => s.targetId)
  );
  const deck = recruiters.filter((r) => !swipedIds.has(r.id));
  return NextResponse.json(deck);
}
