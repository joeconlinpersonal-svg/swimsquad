import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { SetGrid } from "@/lib/types";

function isValidGrid(grid: unknown): grid is SetGrid {
  if (!grid || typeof grid !== "object") return false;
  const g = grid as SetGrid;
  if (!Array.isArray(g.columns) || !g.columns.every((c) => typeof c === "string")) return false;
  if (!Array.isArray(g.rows)) return false;
  return g.rows.every(
    (r) =>
      r &&
      typeof r.label === "string" &&
      Array.isArray(r.values) &&
      r.values.every((v) => v === null || typeof v === "number")
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const date = typeof body?.date === "string" && body.date ? body.date : null;
  const grid = body?.grid;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isValidGrid(grid)) {
    return NextResponse.json({ error: "Invalid grid" }, { status: 400 });
  }

  const sets = await store.updateSet(id, { name: name.slice(0, 60), date, grid });
  return NextResponse.json({ sets });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sets = await store.deleteSet(id);
  return NextResponse.json({ sets });
}
