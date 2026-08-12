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
  return DISTANCES.some((d) => paceHistory(swimmer, d).length >= 2);
}
