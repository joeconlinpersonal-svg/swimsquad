"use client";

import { useMemo, useState } from "react";
import SwimmerCard from "./SwimmerCard";
import TrendChart from "./TrendChart";
import ProgressTable from "./ProgressTable";
import AddEntryModal from "./AddEntryModal";
import { paceHistory } from "@/lib/stats";
import { DISTANCES, type SwimmerWithEntries } from "@/lib/types";

export default function Dashboard({ initial }: { initial: SwimmerWithEntries[] }) {
  const [swimmers, setSwimmers] = useState(initial);
  const [modalSwimmerId, setModalSwimmerId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterId, setFilterId] = useState<string>("all");

  const totalSwims = swimmers.reduce((n, s) => n + s.entries.length, 0);

  const filtered = useMemo(
    () => (filterId === "all" ? swimmers : swimmers.filter((s) => s.id === filterId)),
    [swimmers, filterId]
  );

  const distancesWithData = DISTANCES.filter((d) =>
    filtered.some((s) => paceHistory(s, d).length >= 1)
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">🏊 Squad Swim Tracker</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {swimmers.length} swimmer{swimmers.length === 1 ? "" : "s"} · {totalSwims} swim
            {totalSwims === 1 ? "" : "s"} logged
          </p>
        </div>
        <button
          onClick={() => {
            setModalSwimmerId(null);
            setModalOpen(true);
          }}
          className="self-start rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)]"
        >
          + Log a swim
        </button>
      </header>

      <div className="flex items-center gap-2">
        <label htmlFor="swimmer-filter" className="text-sm text-[var(--text-secondary)]">
          Show
        </label>
        <select
          id="swimmer-filter"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
        >
          <option value="all">All swimmers</option>
          {swimmers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Progress over time</h2>
        <ProgressTable swimmers={filtered} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Trend graphs</h2>
        {distancesWithData.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
            No dated swims yet — add a date when logging a swim to see it charted here.
          </div>
        )}
        {distancesWithData.map((distance) => (
          <div key={distance} className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {distance}m pace
            </h3>
            <TrendChart swimmers={filtered} distance={distance} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Swimmers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <SwimmerCard
              key={s.id}
              swimmer={s}
              onLogSwim={(id) => {
                setModalSwimmerId(id);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {modalOpen && (
        <AddEntryModal
          swimmers={swimmers}
          initialSwimmerId={modalSwimmerId}
          onClose={() => setModalOpen(false)}
          onSaved={setSwimmers}
        />
      )}
    </div>
  );
}
