"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SwimmerCard from "./SwimmerCard";
import TrendChart from "./TrendChart";
import ProgressTable from "./ProgressTable";
import AddEntryModal from "./AddEntryModal";
import EditEntryModal from "./EditEntryModal";
import WaitTracker from "./WaitTracker";
import { paceHistory } from "@/lib/stats";
import { DISTANCES, type Entry, type SwimmerWithEntries, type WaitSession } from "@/lib/types";

export default function Dashboard({
  initial,
  initialWaitSessions,
}: {
  initial: SwimmerWithEntries[];
  initialWaitSessions: WaitSession[];
}) {
  const [swimmers, setSwimmers] = useState(initial);
  const [modalSwimmerId, setModalSwimmerId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ entry: Entry; swimmerName: string } | null>(null);
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            🏊 Squad Swim Tracker
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] sm:text-sm">
            {swimmers.length} swimmer{swimmers.length === 1 ? "" : "s"} · {totalSwims} swim
            {totalSwims === 1 ? "" : "s"} logged
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Link
            href="/sets"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
          >
            🏋️ Sets
          </Link>
          <button
            onClick={() => {
              setModalSwimmerId(null);
              setModalOpen(true);
            }}
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)]"
          >
            + Log a swim
          </button>
        </div>
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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Progress over time</h2>
        <ProgressTable
          swimmers={filtered}
          onEditEntry={(entry, swimmerName) => setEditing({ entry, swimmerName })}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Trend graphs</h2>
        {distancesWithData.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
            No dated swims yet — add a date when logging a swim to see it charted here.
          </div>
        )}
        {distancesWithData.map((distance) => (
          <div key={distance} className="flex flex-col gap-1.5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {distance}m pace
            </h3>
            <TrendChart swimmers={filtered} distance={distance} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Swimmers</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <WaitTracker initial={initialWaitSessions} />

      {modalOpen && (
        <AddEntryModal
          swimmers={swimmers}
          initialSwimmerId={modalSwimmerId}
          onClose={() => setModalOpen(false)}
          onSaved={setSwimmers}
        />
      )}

      {editing && (
        <EditEntryModal
          entry={editing.entry}
          swimmerName={editing.swimmerName}
          onClose={() => setEditing(null)}
          onSaved={setSwimmers}
        />
      )}
    </div>
  );
}
