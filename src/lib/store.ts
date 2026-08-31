import { memoryStore } from "./memoryStore";
import type { SwimStore } from "./store.types";

// Uses Postgres (e.g. Supabase, via Vercel's POSTGRES_URL) once configured.
// Falls back to an in-memory store for local preview so `npm run dev` works
// with zero setup (state resets on restart in that mode).
async function getStore(): Promise<SwimStore> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const { pgStore } = await import("./pgStore");
    return pgStore;
  }
  return memoryStore;
}

export const store: SwimStore = {
  async getSwimmers() {
    return (await getStore()).getSwimmers();
  },
  async addSwimmer(name) {
    return (await getStore()).addSwimmer(name);
  },
  async addEntry(input) {
    return (await getStore()).addEntry(input);
  },
  async updateEntry(id, input) {
    return (await getStore()).updateEntry(id, input);
  },
  async deleteEntry(id) {
    return (await getStore()).deleteEntry(id);
  },
  async getWaitSessions() {
    return (await getStore()).getWaitSessions();
  },
  async addWaitSession(seconds, date) {
    return (await getStore()).addWaitSession(seconds, date);
  },
  async updateWaitSession(id, seconds, date) {
    return (await getStore()).updateWaitSession(id, seconds, date);
  },
  async deleteWaitSession(id) {
    return (await getStore()).deleteWaitSession(id);
  },
  async getWeekSets() {
    return (await getStore()).getWeekSets();
  },
  async createWeekSet(weekOf, copyFromWeekOf) {
    return (await getStore()).createWeekSet(weekOf, copyFromWeekOf);
  },
  async updateWeekSet(id, lanes) {
    return (await getStore()).updateWeekSet(id, lanes);
  },
  async deleteWeekSet(id) {
    return (await getStore()).deleteWeekSet(id);
  },
};
