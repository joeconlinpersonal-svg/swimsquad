"use client";

import { pbsByDistance } from "@/lib/stats";
import { seriesColorVar } from "@/lib/palette";
import { formatDate, formatSecondsToTime } from "@/lib/time";
import type { SwimmerWithEntries } from "@/lib/types";

type Props = {
  swimmer: SwimmerWithEntries;
  onLogSwim: (swimmerId: string) => void;
};

export default function SwimmerCard({ swimmer, onLogSwim }: Props) {
  const pbs = pbsByDistance(swimmer);
  const color = seriesColorVar(swimmer.colorIndex);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
          <h3 className="text-sm font-semibold sm:text-base">{swimmer.name}</h3>
        </div>
        <button
          onClick={() => onLogSwim(swimmer.id)}
          className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)]"
        >
          + Log swim
        </button>
      </div>

      <dl className="grid grid-cols-5 gap-1.5">
        {pbs.map(({ distance, best }) => (
          <div key={distance} className="flex flex-col items-center gap-0.5 text-center">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {distance}m
            </dt>
            <dd className="font-mono text-xs tabular-nums text-[var(--foreground)] sm:text-sm">
              {best ? formatSecondsToTime(best.timeSeconds) : "—"}
            </dd>
          </div>
        ))}
      </dl>

      {pbs.some(({ best }) => best?.date) && (
        <p className="text-xs text-[var(--text-muted)]">
          Latest PB:{" "}
          {(() => {
            const dated = pbs.filter(({ best }) => best?.date);
            const latest = dated.reduce((a, b) => (a.best!.date! > b.best!.date! ? a : b));
            return `${latest.distance}m on ${formatDate(latest.best!.date)}`;
          })()}
        </p>
      )}
    </div>
  );
}
