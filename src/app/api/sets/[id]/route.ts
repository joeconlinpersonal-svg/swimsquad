import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { SetRow } from "@/lib/types";

function isValidRows(rows: unknown): rows is SetRow[] {
  if (!Array.isArray(rows)) return false;
  return rows.every(
    (r) =>
      r &&
      typeof r.label === "string" &&
      (r.distance === null || typeof r.distance === "number")
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const date = typeof body?.date === "string" && body.date ? body.date : null;
  const rows = body?.rows;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isValidRows(rows)) {
    return NextResponse.json({ error: "Invalid rows" }, { status: 400 });
  }

  const sets = await store.updateSet(id, { name: name.slice(0, 60), date, rows });
  return NextResponse.json({ sets });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sets = await store.deleteSet(id);
  return NextResponse.json({ sets });
}
