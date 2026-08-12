import { NextResponse } from "next/server";
import postgres from "postgres";

// Temporary one-off migration endpoint: backfills undated entries to the
// earliest recorded date, and normalizes old "@ X:XX send-off" notes to
// "@X:XX". Guarded by MIGRATION_SECRET; delete this route once run.
export async function POST(request: Request) {
  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = postgres(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!, {
    prepare: false,
  });

  const [{ min_date }] = (await sql`
    SELECT MIN(date) AS min_date FROM entries WHERE date IS NOT NULL
  `) as { min_date: string }[];

  const dateResult = await sql`UPDATE entries SET date = ${min_date} WHERE date IS NULL`;

  const noteResult = await sql`
    UPDATE entries
    SET note = regexp_replace(note, '^@ ?(\\d+:\\d+) send-off$', '@\\1')
    WHERE note ~ '^@ ?\\d+:\\d+ send-off$'
  `;

  await sql.end();

  return NextResponse.json({
    minDate: min_date,
    datesBackfilled: dateResult.count,
    notesNormalized: noteResult.count,
  });
}
