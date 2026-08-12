import { memoryStore } from "./memoryStore";
import type { SwimStore } from "./store.types";

// Uses Postgres (Neon) in production once DATABASE_URL is set on Vercel.
// Falls back to an in-memory store for local preview so `npm run dev` works
// with zero setup (state resets on restart in that mode).
async function getStore(): Promise<SwimStore> {
  if (process.env.DATABASE_URL) {
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
};
