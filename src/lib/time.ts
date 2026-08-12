// Time helpers: swim times are stored in whole seconds and displayed as mm:ss (or h:mm:ss for long swims).

export function parseTimeToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;

  let seconds = 0;
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number);
    seconds = h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts.map(Number);
    seconds = m * 60 + s;
  } else if (parts.length === 1) {
    seconds = Number(parts[0]);
  } else {
    return null;
  }
  return seconds > 0 ? Math.round(seconds) : null;
}

export function formatSecondsToTime(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function paceMinPer100(totalSeconds: number, distanceMeters: number): number {
  return (totalSeconds / distanceMeters) * 100;
}

export function formatPace(totalSeconds: number, distanceMeters: number): string {
  return formatSecondsToTime(paceMinPer100(totalSeconds, distanceMeters));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Compact form for narrow layouts — drops the year (e.g. "16 Jun").
export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
