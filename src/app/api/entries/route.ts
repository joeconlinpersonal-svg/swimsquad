import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { parseTimeToSeconds } from "@/lib/time";
import { DISTANCES } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const swimmerId = typeof body?.swimmerId === "string" ? body.swimmerId : "";
  const distance = Number(body?.distance);
  const timeSeconds = typeof body?.time === "string" ? parseTimeToSeconds(body.time) : null;
  const date = typeof body?.date === "string" && body.date ? body.date : null;
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 100) : null;

  if (!swimmerId) {
    return NextResponse.json({ error: "Swimmer is required" }, { status: 400 });
  }
  if (!DISTANCES.includes(distance as (typeof DISTANCES)[number])) {
    return NextResponse.json({ error: "Invalid distance" }, { status: 400 });
  }
  if (timeSeconds === null) {
    return NextResponse.json({ error: "Enter a time like 1:25 or 12:20" }, { status: 400 });
  }

  const swimmers = await store.addEntry({
    swimmerId,
    distance: distance as (typeof DISTANCES)[number],
    timeSeconds,
    date,
    note,
  });

  return NextResponse.json({ swimmers });
}
