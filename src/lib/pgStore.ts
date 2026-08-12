import postgres from "postgres";
import { randomUUID } from "crypto";
import { SEED_SWIMMERS } from "./seedData";
import { parseTimeToSeconds } from "./time";
import { SWIMMER_COLORS, type Entry, type Swimmer, type SwimmerWithEntries } from "./types";
import type { NewEntryInput, SwimStore } from "./store.types";

const numColors = SWIMMER_COLORS.length;

// POSTGRES_URL is the pooled connection string Vercel's Supabase integration sets;
// DATABASE_URL is honored too in case a different Postgres provider is wired up.
// prepare: false is required for pooled (pgbouncer/Supavisor) connections in transaction mode.
const sql = postgres(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!, {
  prepare: false,
});

let initPromise: Promise<void> | null = null;

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS swimmers (
      id UUID PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID PRIMARY KEY,
      swimmer_id UUID NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
      distance INT NOT NULL,
      time_seconds NUMERIC NOT NULL,
      date DATE,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const [{ count }] = (await sql`SELECT COUNT(*)::int AS count FROM swimmers`) as {
    count: number;
  }[];

  if (count === 0) {
    for (let i = 0; i < SEED_SWIMMERS.length; i++) {
      const swimmer = SEED_SWIMMERS[i];
      const swimmerId = randomUUID();
      const colorIndex = i % numColors;
      await sql`INSERT INTO swimmers (id, name, color_index) VALUES (${swimmerId}, ${swimmer.name}, ${colorIndex})`;
      for (const entry of swimmer.entries) {
        const seconds = parseTimeToSeconds(entry.time);
        if (seconds === null) continue;
        await sql`
          INSERT INTO entries (id, swimmer_id, distance, time_seconds, date, note)
          VALUES (${randomUUID()}, ${swimmerId}, ${entry.distance}, ${seconds}, ${entry.date}, ${entry.note ?? null})
        `;
      }
    }
  }
}

function init() {
  if (!initPromise) initPromise = ensureSchema();
  return initPromise;
}

async function loadAll(): Promise<SwimmerWithEntries[]> {
  const swimmers = (await sql`
    SELECT id, name, color_index AS "colorIndex" FROM swimmers ORDER BY name
  `) as Swimmer[];
  const entries = (await sql`
    SELECT id, swimmer_id AS "swimmerId", distance, time_seconds AS "timeSeconds",
           date, note, created_at AS "createdAt"
    FROM entries ORDER BY date NULLS LAST, created_at
  `) as Entry[];

  return swimmers.map((s) => ({
    ...s,
    entries: entries
      .filter((e) => e.swimmerId === s.id)
      .map((e) => ({
        ...e,
        timeSeconds: Number(e.timeSeconds),
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : null,
      })),
  }));
}

export const pgStore: SwimStore = {
  async getSwimmers() {
    await init();
    return loadAll();
  },

  async addSwimmer(name: string) {
    await init();
    const existing = (await sql`SELECT id FROM swimmers WHERE lower(name) = lower(${name})`) as {
      id: string;
    }[];
    if (!existing.length) {
      const countRows = (await sql`SELECT COUNT(*)::int AS count FROM swimmers`) as {
        count: number;
      }[];
      const colorIndex = countRows[0].count % numColors;
      await sql`INSERT INTO swimmers (id, name, color_index) VALUES (${randomUUID()}, ${name}, ${colorIndex})`;
    }
    const all = await loadAll();
    return all.find((s) => s.name.toLowerCase() === name.toLowerCase())!;
  },

  async addEntry(input: NewEntryInput) {
    await init();
    await sql`
      INSERT INTO entries (id, swimmer_id, distance, time_seconds, date, note)
      VALUES (${randomUUID()}, ${input.swimmerId}, ${input.distance}, ${input.timeSeconds}, ${input.date}, ${input.note ?? null})
    `;
    return loadAll();
  },
};
