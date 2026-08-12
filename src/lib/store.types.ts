import type { Distance, SwimmerWithEntries, WaitSession } from "./types";

export type NewEntryInput = {
  swimmerId: string;
  distance: Distance;
  timeSeconds: number;
  date: string | null;
  note?: string | null;
};

export type EntryUpdate = {
  timeSeconds: number;
  date: string | null;
  note?: string | null;
};

export interface SwimStore {
  getSwimmers(): Promise<SwimmerWithEntries[]>;
  addSwimmer(name: string): Promise<SwimmerWithEntries>;
  addEntry(input: NewEntryInput): Promise<SwimmerWithEntries[]>;
  updateEntry(id: string, input: EntryUpdate): Promise<SwimmerWithEntries[]>;
  getWaitSessions(): Promise<WaitSession[]>;
  addWaitSession(seconds: number, date: string): Promise<WaitSession[]>;
  updateWaitSession(id: string, seconds: number, date: string): Promise<WaitSession[]>;
}
