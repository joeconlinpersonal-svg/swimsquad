import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { LANES, type Lane, type SetRow } from "@/lib/types";

function isValidLanes(lanes: unknown): lanes is Record<Lane, SetRow[]> {
  if (!lanes || typeof lanes !== "object") return false;
  const l = lanes as Record<string, unknown>;
  return LANES.every((lane) => {
    const rows = l[lane];
    return (
      Array.isArray(rows) &&
      rows.every(
        (r) =>
          r &&
          typeof r.label === "string" &&
          (r.distance === null || typeof r.distance === "number")
      )
    );
  });
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
