"use client";

import { groupedProgress } from "@/lib/stats";
import { seriesColorVar } from "@/lib/palette";
import { formatDate, formatDateShort, formatSecondsToTime } from "@/lib/time";
import { DISTANCES, type Entry, type SwimmerWithEntries } from "@/lib/types";

type Props = {
  swimmers: SwimmerWithEntries[];
  onEditEntry: (entry: Entry, swimmerName: string) => void;
};

export default function ProgressTable({ swimmers, onEditEntry }: Props) {
  const groups = groupedProgress(swimmers);

  if (!groups.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
        No swims logged yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ swimmer, rows }) => (
        <div
          key={swimmer.id}
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-2.5 py-1.5 sm:px-3 sm:py-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: seriesColorVar(swimmer.colorIndex) }}
              aria-hidden
            />
            <h3 className="text-sm font-semibold">{swimmer.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-[11px] sm:min-w-[420px] sm:table-auto sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[9px] font-medium uppercase tracking-wide text-[var(--text-muted)] sm:text-xs">
                  <th className="w-[17%] px-1 py-1 font-medium sm:w-auto sm:px-3 sm:py-2">
                    Date
                  </th>
                  {DISTANCES.map((d) => (
                    <th
                      key={d}
                      className="px-0.5 py-1 text-right font-medium sm:px-3 sm:py-2"
                    >
                      {d}m
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.date ?? `undated-${i}`}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="whitespace-nowrap px-1 py-1 text-[var(--text-secondary)] sm:px-3 sm:py-1.5">
                      <span className="sm:hidden">{formatDateShort(row.date)}</span>
                      <span className="hidden sm:inline">{formatDate(row.date)}</span>
                    </td>
                    {DISTANCES.map((d) => {
                      const entry = row.cells[d];
                      return (
                        <td key={d} className="px-0.5 py-1 text-right sm:px-1.5">
                          {entry ? (
                            <button
                              type="button"
                              onClick={() => onEditEntry(entry, swimmer.name)}
                              className="inline-flex w-full flex-col items-end rounded-md px-1 py-0.5 font-mono tabular-nums hover:bg-[var(--background)] sm:px-1.5"
                            >
                              <span>{formatSecondsToTime(entry.timeSeconds)}</span>
                              {entry.note && (
                                <span className="font-sans text-[8px] text-[var(--text-muted)] sm:text-[10px]">
                                  {entry.note}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="px-1 font-mono text-[var(--text-muted)]">—</span>
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
