import type { Distance, SetLane, SwimmerWithEntries, WaitSession, WeekSet } from "./types";

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
  getWeekSets(): Promise<WeekSet[]>;
  createWeekSet(weekOf: string, copyFromWeekOf: string | null): Promise<WeekSet[]>;
  updateWeekSet(id: string, lanes: SetLane[]): Promise<WeekSet[]>;
  deleteWeekSet(id: string): Promise<WeekSet[]>;
}
