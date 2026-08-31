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

export type WaitSession = {
  id: string;
  seconds: number;
  date: string; // ISO date
  createdAt: string;
};

// Squad swims Tuesday mornings, normally in three lanes. A "week set" is one
// Tuesday's session: one ordered list of labeled distances per lane. New
// weeks start with these three, but a lane can be added or removed per week
// (e.g. a one-off fourth lane) — so lanes are an ordered list, not a fixed set.
export const DEFAULT_LANE_NAMES = ["Faster Pasta", "Mild sauce", "Leisure Lane"];

export type SetRow = {
  label: string;
  distance: number | null;
};

export type SetLane = {
  name: string;
  rows: SetRow[];
};

export type WeekSet = {
  id: string;
  weekOf: string; // ISO date of that week's Tuesday
  lanes: SetLane[];
  createdAt: string;
  updatedAt: string;
};

export function defaultLaneRows(): SetRow[] {
  return [
    { label: "Warm up", distance: 200 },
    { label: "Drill", distance: 100 },
    { label: "Main set", distance: null },
    { label: "Cool down", distance: 100 },
  ];
}

export function defaultLanes(): SetLane[] {
  return DEFAULT_LANE_NAMES.map((name) => ({ name, rows: defaultLaneRows() }));
}

// The three regular lanes always sort first, in their usual order (Postgres
// JSONB doesn't preserve object/array insertion order reliably, so this is
// re-applied on every read rather than trusted from storage); any extra
// lanes keep their existing relative order after that.
export function sortLanes(lanes: SetLane[]): SetLane[] {
  return [...lanes].sort((a, b) => {
    const ai = DEFAULT_LANE_NAMES.indexOf(a.name);
    const bi = DEFAULT_LANE_NAMES.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
}

// Pure calendar-date arithmetic, anchored in UTC so it never drifts with the
// host's or browser's local time zone — every date here is a plain
// yyyy-mm-dd string, not an instant.
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

// The Tuesday (ISO date) of the calendar week containing `iso` — may be
// before, on, or after `iso` depending on what day of the week it is.
export function tuesdayOfWeek(iso: string): string {
  const d = parseISODate(iso);
  const day = d.getUTCDay(); // Sun=0 ... Tue=2 ... Sat=6
  d.setUTCDate(d.getUTCDate() + (2 - day));
  return toISODate(d);
}

// Most recent Tuesday whose 7am swim has already happened, given today's
// local date and hour.
export function lastCompletedSwimTuesday(todayIso: string, todayHour: number): string {
  const tue = tuesdayOfWeek(todayIso);
  if (tue > todayIso || (tue === todayIso && todayHour < 7)) {
    return addDaysISO(tue, -7);
  }
  return tue;
}

// The Tuesday to prep next, once the most recent swim is done.
export function nextWeekToPrep(todayIso: string, todayHour: number): string {
  return addDaysISO(lastCompletedSwimTuesday(todayIso, todayHour), 7);
}

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
