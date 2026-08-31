import postgres from "postgres";
import { randomUUID } from "crypto";
import { SEED_SWIMMERS, SEED_WAIT_SESSIONS } from "./seedData";
import { parseTimeToSeconds } from "./time";
import {
  DEFAULT_LANE_NAMES,
  defaultLanes,
  SWIMMER_COLORS,
  type Entry,
  type SetLane,
  type SetRow,
  type Swimmer,
  type SwimmerWithEntries,
  type WaitSession,
  type WeekSet,
} from "./types";
import type { EntryUpdate, NewEntryInput, SwimStore } from "./store.types";

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

  await sql`
    CREATE TABLE IF NOT EXISTS wait_sessions (
      id UUID PRIMARY KEY,
      seconds NUMERIC NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Legacy table from the pre-week Set Builder — kept only so migration below
  // has something to read from on an existing database; no longer written to.
  await sql`
    CREATE TABLE IF NOT EXISTS swim_sets (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      date DATE,
      grid JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS week_sets (
      id UUID PRIMARY KEY,
      week_of DATE UNIQUE NOT NULL,
      lanes JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

  const [{ count: waitCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM wait_sessions
  `) as { count: number }[];

  if (waitCount === 0) {
    for (const w of SEED_WAIT_SESSIONS) {
      await sql`
        INSERT INTO wait_sessions (id, seconds, date) VALUES (${randomUUID()}, ${w.seconds}, ${w.date})
      `;
    }
  }

  // One-time migration: the old Set Builder stored one row per lane per
  // week (name = lane, date = that Tuesday). Fold any such rows into
  // week_sets so real data already entered isn't lost.
  const [{ count: weekCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM week_sets
  `) as { count: number }[];

  if (weekCount === 0) {
    const legacyRows = (await sql`
      SELECT name, date, grid FROM swim_sets WHERE date IS NOT NULL
    `) as { name: string; date: string; grid: SetRow[] }[];

    const byWeek = new Map<string, SetLane[]>();
    for (const row of legacyRows) {
      const weekOf = new Date(row.date).toISOString().slice(0, 10);
      if (!DEFAULT_LANE_NAMES.includes(row.name)) continue;
      const lanes = byWeek.get(weekOf) ?? defaultLanes();
      const lane = lanes.find((l) => l.name === row.name);
      if (lane) lane.rows = row.grid;
      byWeek.set(weekOf, lanes);
    }

    for (const [weekOf, lanes] of byWeek) {
      await sql`
        INSERT INTO week_sets (id, week_of, lanes) VALUES (${randomUUID()}, ${weekOf}, ${sql.json(lanes)})
      `;
    }
  }

  // A second-generation migration: week_sets briefly stored `lanes` as a
  // {laneName: rows[]} object (fixed 3 lanes). Convert any rows still in
  // that shape to the current SetLane[] array so lanes can be added/removed.
  const oldShapeRows = (await sql`
    SELECT id, lanes FROM week_sets WHERE jsonb_typeof(lanes) = 'object'
  `) as { id: string; lanes: Record<string, SetRow[]> }[];

  for (const row of oldShapeRows) {
    const lanes: SetLane[] = Object.entries(row.lanes).map(([name, rows]) => ({ name, rows }));
    await sql`UPDATE week_sets SET lanes = ${sql.json(lanes)} WHERE id = ${row.id}`;
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

  async updateEntry(id: string, input: EntryUpdate) {
    await init();
    await sql`
      UPDATE entries
      SET time_seconds = ${input.timeSeconds}, date = ${input.date}, note = ${input.note ?? null}
      WHERE id = ${id}
    `;
    return loadAll();
  },

  async getWaitSessions() {
    await init();
    const rows = (await sql`
      SELECT id, seconds, date, created_at AS "createdAt" FROM wait_sessions
      ORDER BY date, created_at
    `) as WaitSession[];
    return rows.map((r) => ({
      ...r,
      seconds: Number(r.seconds),
      date: new Date(r.date).toISOString().slice(0, 10),
    }));
  },

  async addWaitSession(seconds: number, date: string) {
    await init();
    await sql`INSERT INTO wait_sessions (id, seconds, date) VALUES (${randomUUID()}, ${seconds}, ${date})`;
    return pgStore.getWaitSessions();
  },

  async updateWaitSession(id: string, seconds: number, date: string) {
    await init();
    await sql`UPDATE wait_sessions SET seconds = ${seconds}, date = ${date} WHERE id = ${id}`;
    return pgStore.getWaitSessions();
  },

  async getWeekSets() {
    await init();
    const rows = (await sql`
      SELECT id, week_of AS "weekOf", lanes, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM week_sets ORDER BY week_of
    `) as WeekSet[];
    return rows.map((r) => ({
      ...r,
      weekOf: new Date(r.weekOf).toISOString().slice(0, 10),
    }));
  },

  async createWeekSet(weekOf: string, copyFromWeekOf: string | null) {
    await init();
    const existing = (await sql`SELECT id FROM week_sets WHERE week_of = ${weekOf}`) as {
      id: string;
    }[];
    if (!existing.length) {
      let lanes = defaultLanes();
      if (copyFromWeekOf) {
        const source = (await sql`
          SELECT lanes FROM week_sets WHERE week_of = ${copyFromWeekOf}
        `) as { lanes: SetLane[] }[];
        if (source.length) lanes = source[0].lanes;
      }
      await sql`
        INSERT INTO week_sets (id, week_of, lanes) VALUES (${randomUUID()}, ${weekOf}, ${sql.json(lanes)})
      `;
    }
    return pgStore.getWeekSets();
  },

  async updateWeekSet(id: string, lanes: SetLane[]) {
    await init();
    await sql`
      UPDATE week_sets SET lanes = ${sql.json(lanes)}, updated_at = now() WHERE id = ${id}
    `;
    return pgStore.getWeekSets();
  },

  async deleteWeekSet(id: string) {
    await init();
    await sql`DELETE FROM week_sets WHERE id = ${id}`;
    return pgStore.getWeekSets();
  },
};
