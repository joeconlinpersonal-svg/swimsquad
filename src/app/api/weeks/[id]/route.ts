import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { SetLane } from "@/lib/types";

function isValidLanes(lanes: unknown): lanes is SetLane[] {
  if (!Array.isArray(lanes)) return false;
  return lanes.every(
    (lane) =>
      lane &&
      typeof lane.name === "string" &&
      Array.isArray(lane.rows) &&
      lane.rows.every(
        (r: unknown) =>
          r &&
          typeof r === "object" &&
          typeof (r as { label?: unknown }).label === "string" &&
          ((r as { distance?: unknown }).distance === null ||
            typeof (r as { distance?: unknown }).distance === "number")
      )
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const lanes = body?.lanes;

  if (!isValidLanes(lanes)) {
    return NextResponse.json({ error: "Invalid lanes" }, { status: 400 });
  }

  const weeks = await store.updateWeekSet(id, lanes);
  return NextResponse.json({ weeks });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const weeks = await store.deleteWeekSet(id);
  return NextResponse.json({ weeks });
}
