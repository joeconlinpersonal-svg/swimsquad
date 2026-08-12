import type { Distance, SwimmerWithEntries } from "./types";
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

export type FlatEntry = SwimmerWithEntries["entries"][number] & {
  swimmerName: string;
  colorIndex: number;
};

export function flattenEntries(swimmers: SwimmerWithEntries[]): FlatEntry[] {
  return swimmers
    .flatMap((s) =>
      s.entries.map((e) => ({ ...e, swimmerName: s.name, colorIndex: s.colorIndex }))
    )
    .sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1;
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return b.createdAt < a.createdAt ? -1 : 1;
    });
}
