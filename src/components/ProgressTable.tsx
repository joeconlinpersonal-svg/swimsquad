"use client";

import { groupedProgress } from "@/lib/stats";
import { seriesColorVar } from "@/lib/palette";
import { formatDate, formatSecondsToTime } from "@/lib/time";
import { DISTANCES, type SwimmerWithEntries } from "@/lib/types";

type Props = {
  swimmers: SwimmerWithEntries[];
};

export default function ProgressTable({ swimmers }: Props) {
  const groups = groupedProgress(swimmers);

  if (!groups.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
        No swims logged yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(({ swimmer, rows }) => (
        <div
          key={swimmer.id}
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: seriesColorVar(swimmer.colorIndex) }}
              aria-hidden
            />
            <h3 className="text-sm font-semibold">{swimmer.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-4 py-2 font-medium">Date</th>
                  {DISTANCES.map((d) => (
                    <th key={d} className="px-4 py-2 text-right font-medium">
                      {d}m
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.date ?? `undated-${i}`}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
                      {formatDate(row.date)}
                    </td>
                    {DISTANCES.map((d) => {
                      const entry = row.cells[d];
                      return (
                        <td
                          key={d}
                          className="whitespace-nowrap px-4 py-2 text-right font-mono tabular-nums"
                        >
                          {entry ? (
                            <span className="inline-flex flex-col items-end">
                              <span>{formatSecondsToTime(entry.timeSeconds)}</span>
                              {entry.note && (
                                <span className="font-sans text-[10px] text-[var(--text-muted)]">
                                  {entry.note}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
