import type { Distance, SetRow, SwimmerWithEntries, SwimSet, WaitSession } from "./types";

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

export type SetUpdate = {
  name: string;
  date: string | null;
  rows: SetRow[];
};

export interface SwimStore {
  getSwimmers(): Promise<SwimmerWithEntries[]>;
  addSwimmer(name: string): Promise<SwimmerWithEntries>;
  addEntry(input: NewEntryInput): Promise<SwimmerWithEntries[]>;
  updateEntry(id: string, input: EntryUpdate): Promise<SwimmerWithEntries[]>;
  getWaitSessions(): Promise<WaitSession[]>;
  addWaitSession(seconds: number, date: string): Promise<WaitSession[]>;
  updateWaitSession(id: string, seconds: number, date: string): Promise<WaitSession[]>;
  getSets(): Promise<SwimSet[]>;
  createSet(name: string): Promise<SwimSet[]>;
  updateSet(id: string, input: SetUpdate): Promise<SwimSet[]>;
  deleteSet(id: string): Promise<SwimSet[]>;
}
