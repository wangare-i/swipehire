import { NextResponse } from "next/server";
import { recordSwipe } from "@/lib/db";
import type { TargetType, SwipeDirection } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const { targetType, targetId, direction } = body as {
    targetType: TargetType;
    targetId: string;
    direction: SwipeDirection;
  };

  if (!targetType || !targetId || !direction) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const swipe = await recordSwipe(targetType, targetId, direction);
  return NextResponse.json(swipe);
}
