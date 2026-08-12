import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { parseTimeToSeconds } from "@/lib/time";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const timeSeconds = typeof body?.time === "string" ? parseTimeToSeconds(body.time) : null;
  const date = typeof body?.date === "string" && body.date ? body.date : null;
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 100) : null;

  if (timeSeconds === null) {
    return NextResponse.json({ error: "Enter a time like 1:25 or 12:20" }, { status: 400 });
  }

  const swimmers = await store.updateEntry(id, { timeSeconds, date, note });
  return NextResponse.json({ swimmers });
}
