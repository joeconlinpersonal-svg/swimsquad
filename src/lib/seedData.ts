import { parseTimeToSeconds } from "./time";
import type { Distance } from "./types";

export type SeedEntry = {
  distance: Distance;
  time: string; // mm:ss, parsed via parseTimeToSeconds
  date: string | null; // ISO yyyy-mm-dd
  note?: string;
};

export type SeedSwimmer = {
  name: string;
  entries: SeedEntry[];
};

// Earliest dated swim in the original spreadsheet — undated entries are
// assumed to be from around the same time, so they're backfilled to this
// date rather than left blank.
const EARLIEST_DATE = "2026-06-16";

// Transcribed from the squad's tracking spreadsheet.
export const SEED_SWIMMERS: SeedSwimmer[] = [
  {
    name: "Slow Joe",
    entries: [
      { distance: 50, time: "0:38", date: EARLIEST_DATE },
      { distance: 100, time: "1:30", date: EARLIEST_DATE, note: "@2:00" },
      { distance: 100, time: "1:25", date: EARLIEST_DATE },
      { distance: 400, time: "6:28", date: "2026-06-16" },
      { distance: 400, time: "6:14", date: "2026-08-06" },
      { distance: 1000, time: "16:44", date: "2026-06-30" },
    ],
  },
  {
    name: "Terrific Tej",
    entries: [
      { distance: 50, time: "1:12", date: EARLIEST_DATE },
      { distance: 100, time: "2:50", date: EARLIEST_DATE },
      { distance: 400, time: "12:20", date: "2026-07-28" },
    ],
  },
  {
    name: "Crazy Clara",
    entries: [
      { distance: 50, time: "0:50", date: EARLIEST_DATE },
      { distance: 100, time: "1:47", date: EARLIEST_DATE, note: "@2:30" },
      { distance: 400, time: "7:30", date: "2026-06-16" },
      { distance: 400, time: "7:26", date: "2026-07-28" },
      { distance: 1000, time: "19:36", date: "2026-06-16" },
    ],
  },
  {
    name: "Awesome April",
    entries: [
      { distance: 50, time: "0:45", date: EARLIEST_DATE },
      { distance: 100, time: "1:35", date: EARLIEST_DATE, note: "@2:00" },
      { distance: 400, time: "5:58", date: EARLIEST_DATE },
      { distance: 1000, time: "15:58", date: EARLIEST_DATE },
    ],
  },
  {
    name: "Holey Holly",
    entries: [
      { distance: 50, time: "0:57", date: EARLIEST_DATE },
      { distance: 100, time: "2:05", date: EARLIEST_DATE },
      { distance: 400, time: "10:07", date: "2026-07-21" },
      { distance: 1000, time: "27:28", date: "2026-07-21" },
    ],
  },
  {
    name: "Silly Sierra",
    entries: [{ distance: 50, time: "1:30", date: EARLIEST_DATE }],
  },
  {
    name: "Ludicrous Liv",
    entries: [
      { distance: 50, time: "0:55", date: EARLIEST_DATE },
      { distance: 100, time: "1:55", date: EARLIEST_DATE },
      { distance: 400, time: "8:29", date: "2026-07-04" },
    ],
  },
];

export function validateSeed() {
  for (const swimmer of SEED_SWIMMERS) {
    for (const entry of swimmer.entries) {
      if (parseTimeToSeconds(entry.time) === null) {
        throw new Error(`Bad seed time for ${swimmer.name}: ${entry.time}`);
      }
    }
  }
}
