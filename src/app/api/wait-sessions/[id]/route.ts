import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const seconds = Number(body?.seconds);
  const date = typeof body?.date === "string" && body.date ? body.date : null;

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const sessions = await store.updateWaitSession(id, Math.round(seconds), date);
  return NextResponse.json({ sessions });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessions = await store.deleteWaitSession(id);
  return NextResponse.json({ sessions });
}
