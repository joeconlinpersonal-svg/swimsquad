import { randomUUID } from "crypto";
import { parseTimeToSeconds } from "./time";
import { SEED_SWIMMERS, SEED_WAIT_SESSIONS } from "./seedData";
import {
  emptyLanes,
  SWIMMER_COLORS,
  type Lane,
  type SetRow,
  type SwimmerWithEntries,
  type WaitSession,
  type WeekSet,
} from "./types";
import type { EntryUpdate, NewEntryInput, SwimStore } from "./store.types";

const numColors = SWIMMER_COLORS.length;

// In-memory store used when no DATABASE_URL is configured (local preview only —
// state resets on server restart, and is per-instance in serverless deploys).
function buildInitialState(): SwimmerWithEntries[] {
  const now = new Date().toISOString();
  return SEED_SWIMMERS.map((swimmer, i) => ({
    id: randomUUID(),
    name: swimmer.name,
    colorIndex: i % numColors,
    entries: swimmer.entries.map((e) => ({
      id: randomUUID(),
      swimmerId: "", // filled below
      distance: e.distance,
      timeSeconds: parseTimeToSeconds(e.time)!,
      date: e.date,
      note: e.note ?? null,
      createdAt: now,
    })),
  })).map((s) => ({
    ...s,
    entries: s.entries.map((e) => ({ ...e, swimmerId: s.id })),
  }));
}

function buildInitialWaitSessions(): WaitSession[] {
  const now = new Date().toISOString();
  return SEED_WAIT_SESSIONS.map((w) => ({
    id: randomUUID(),
    seconds: w.seconds,
    date: w.date,
    createdAt: now,
  }));
}

const globalForStore = globalThis as unknown as {
  __swimState?: SwimmerWithEntries[];
  __waitState?: WaitSession[];
  __weekSetsState?: WeekSet[];
};
if (!globalForStore.__swimState) {
  globalForStore.__swimState = buildInitialState();
}
if (!globalForStore.__waitState) {
  globalForStore.__waitState = buildInitialWaitSessions();
}
if (!globalForStore.__weekSetsState) {
  globalForStore.__weekSetsState = [];
}

export const memoryStore: SwimStore = {
  async getSwimmers() {
    return globalForStore.__swimState!;
  },

  async addSwimmer(name: string) {
    const existing = globalForStore.__swimState!.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing;
    const swimmer: SwimmerWithEntries = {
      id: randomUUID(),
      name,
      colorIndex: globalForStore.__swimState!.length % numColors,
      entries: [],
    };
    globalForStore.__swimState!.push(swimmer);
    return swimmer;
  },

  async addEntry(input: NewEntryInput) {
    const swimmer = globalForStore.__swimState!.find((s) => s.id === input.swimmerId);
    if (!swimmer) throw new Error("Swimmer not found");
    swimmer.entries.push({
      id: randomUUID(),
      swimmerId: swimmer.id,
      distance: input.distance,
      timeSeconds: input.timeSeconds,
      date: input.date,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    });
    return globalForStore.__swimState!;
  },

  async updateEntry(id: string, input: EntryUpdate) {
    for (const swimmer of globalForStore.__swimState!) {
      const entry = swimmer.entries.find((e) => e.id === id);
      if (entry) {
        entry.timeSeconds = input.timeSeconds;
        entry.date = input.date;
        entry.note = input.note ?? null;
        break;
      }
    }
    return globalForStore.__swimState!;
  },

  async getWaitSessions() {
    return globalForStore.__waitState!;
  },

  async addWaitSession(seconds: number, date: string) {
    globalForStore.__waitState!.push({
      id: randomUUID(),
      seconds,
      date,
      createdAt: new Date().toISOString(),
    });
    return globalForStore.__waitState!;
  },

  async updateWaitSession(id: string, seconds: number, date: string) {
    const session = globalForStore.__waitState!.find((w) => w.id === id);
    if (session) {
      session.seconds = seconds;
      session.date = date;
    }
    return globalForStore.__waitState!;
  },

  async getWeekSets() {
    return globalForStore.__weekSetsState!;
  },

  async createWeekSet(weekOf: string, copyFromWeekOf: string | null) {
    const existing = globalForStore.__weekSetsState!.find((w) => w.weekOf === weekOf);
    if (existing) return globalForStore.__weekSetsState!;

    const source = copyFromWeekOf
      ? globalForStore.__weekSetsState!.find((w) => w.weekOf === copyFromWeekOf)
      : undefined;
    const lanes: Record<Lane, SetRow[]> = source
      ? (JSON.parse(JSON.stringify(source.lanes)) as Record<Lane, SetRow[]>)
      : emptyLanes();

    const now = new Date().toISOString();
    globalForStore.__weekSetsState!.push({
      id: randomUUID(),
      weekOf,
      lanes,
      createdAt: now,
      updatedAt: now,
    });
    return globalForStore.__weekSetsState!;
  },

  async updateWeekSet(id: string, lanes: Record<Lane, SetRow[]>) {
    const week = globalForStore.__weekSetsState!.find((w) => w.id === id);
    if (week) {
      week.lanes = lanes;
      week.updatedAt = new Date().toISOString();
    }
    return globalForStore.__weekSetsState!;
  },

  async deleteWeekSet(id: string) {
    globalForStore.__weekSetsState = globalForStore.__weekSetsState!.filter((w) => w.id !== id);
    return globalForStore.__weekSetsState;
  },
};
