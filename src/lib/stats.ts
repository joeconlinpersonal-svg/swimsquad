import type { Distance, Entry, SwimmerWithEntries } from "./types";
import { DISTANCES } from "./types";

export function bestEntryFor(swimmer: SwimmerWithEntries, distance: Distance) {
  const entries = swimmer.entries.filter((e) => e.distance === distance);
  if (!entries.length) return null;
  return entries.reduce((best, e) => (e.timeSeconds < best.timeSeconds ? e : best));
}

export function pbsByDistance(swimmer: SwimmerWithEntries) {
  return DISTANCES.map((distance) => ({
    distance,
    best: bestEntryFor(swimmer, distance),
  }));
}

export function paceHistory(swimmer: SwimmerWithEntries, distance: Distance) {
  return swimmer.entries
    .filter((e) => e.distance === distance && e.date)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));
}

export function hasProgressData(swimmer: SwimmerWithEntries) {
  return DISTANCES.some((d) => paceHistory(swimmer, d).length >= 1);
}

export type ProgressRow = {
  date: string | null;
  cells: Partial<Record<Distance, Entry>>;
};

export type SwimmerProgress = {
  swimmer: SwimmerWithEntries;
  rows: ProgressRow[];
};

// One sub-table per swimmer, pivoted so each row is a date and each column a
// distance — mirrors the original spreadsheet's per-person progress blocks.
export function groupedProgress(swimmers: SwimmerWithEntries[]): SwimmerProgress[] {
  return swimmers
    .filter((s) => s.entries.length > 0)
    .map((swimmer) => {
      const byDate = new Map<string, ProgressRow>();
      for (const entry of swimmer.entries) {
        const key = entry.date ?? "__undated__";
        if (!byDate.has(key)) byDate.set(key, { date: entry.date, cells: {} });
        const row = byDate.get(key)!;
        const existing = row.cells[entry.distance];
        if (!existing || entry.timeSeconds < existing.timeSeconds) {
          row.cells[entry.distance] = entry;
        }
      }
      const rows = Array.from(byDate.values()).sort((a, b) => {
        if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        return 0;
      });
      return { swimmer, rows };
    });
}
