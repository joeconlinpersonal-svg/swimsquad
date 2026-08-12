import { NextResponse } from "next/server";
import postgres from "postgres";

// Temporary one-off cleanup endpoint: deletes wait_sessions rows on a given
// date (used to remove an accidental stopwatch test). Guarded by
// MIGRATION_SECRET; delete this route once run.
export async function POST(request: Request) {
  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : null;
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const sql = postgres(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!, {
    prepare: false,
  });

  const before = await sql`SELECT id, seconds, date FROM wait_sessions WHERE date = ${date}`;
  const result = await sql`DELETE FROM wait_sessions WHERE date = ${date}`;

  await sql.end();

  return NextResponse.json({ deleted: result.count, rows: before });
}
