"use client";

import { flattenEntries } from "@/lib/stats";
import { seriesColorVar } from "@/lib/palette";
import { formatDate, formatPace, formatSecondsToTime } from "@/lib/time";
import type { SwimmerWithEntries } from "@/lib/types";

type Props = {
  swimmers: SwimmerWithEntries[];
};

export default function ProgressTable({ swimmers }: Props) {
  const rows = flattenEntries(swimmers);

  if (!rows.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
        No swims logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium">Swimmer</th>
            <th className="px-4 py-2.5 font-medium">Distance</th>
            <th className="px-4 py-2.5 font-medium">Time</th>
            <th className="px-4 py-2.5 font-medium">Pace /100</th>
            <th className="px-4 py-2.5 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
            >
              <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
                {formatDate(row.date)}
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: seriesColorVar(row.colorIndex) }}
                    aria-hidden
                  />
                  {row.swimmerName}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 tabular-nums">{row.distance}m</td>
              <td className="whitespace-nowrap px-4 py-2 font-mono tabular-nums">
                {formatSecondsToTime(row.timeSeconds)}
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-mono tabular-nums text-[var(--text-secondary)]">
                {formatPace(row.timeSeconds, row.distance)}
              </td>
              <td className="px-4 py-2 text-[var(--text-secondary)]">{row.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
