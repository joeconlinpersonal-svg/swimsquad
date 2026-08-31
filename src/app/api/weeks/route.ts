import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const weeks = await store.getWeekSets();
  return NextResponse.json({ weeks });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const weekOf = typeof body?.weekOf === "string" ? body.weekOf : "";
  const copyFromWeekOf =
    typeof body?.copyFromWeekOf === "string" && body.copyFromWeekOf ? body.copyFromWeekOf : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) {
    return NextResponse.json({ error: "weekOf must be an ISO date" }, { status: 400 });
  }

  const weeks = await store.createWeekSet(weekOf, copyFromWeekOf);
  return NextResponse.json({ weeks });
}
