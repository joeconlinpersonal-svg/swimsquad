import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const sets = await store.getSets();
  return NextResponse.json({ sets });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const sets = await store.createSet(name.slice(0, 60));
  return NextResponse.json({ sets });
}
