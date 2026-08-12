import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const swimmers = await store.getSwimmers();
  return NextResponse.json({ swimmers });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }
  const swimmer = await store.addSwimmer(name);
  return NextResponse.json({ swimmer });
}
