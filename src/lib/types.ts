export const DISTANCES = [50, 100, 200, 400, 1000] as const;
export type Distance = (typeof DISTANCES)[number];

export type Entry = {
  id: string;
  swimmerId: string;
  distance: Distance;
  timeSeconds: number;
  date: string | null; // ISO date, may be unknown
  note: string | null;
  createdAt: string;
};

export type Swimmer = {
  id: string;
  name: string;
  colorIndex: number;
};

export type SwimmerWithEntries = Swimmer & {
  entries: Entry[];
};

// Validated categorical palette (light-mode hex) — fixed order, never cycled/reassigned.
export const SWIMMER_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const SWIMMER_COLORS_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
];
