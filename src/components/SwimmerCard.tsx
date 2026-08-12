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
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
          <h3 className="text-base font-semibold">{swimmer.name}</h3>
        </div>
        <button
          onClick={() => onLogSwim(swimmer.id)}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)]"
        >
          + Log swim
        </button>
      </div>

      <dl className="grid grid-cols-5 gap-2">
        {pbs.map(({ distance, best }) => (
          <div key={distance} className="flex flex-col items-center gap-1 text-center">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {distance}m
            </dt>
            <dd className="font-mono text-sm tabular-nums text-[var(--foreground)]">
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
