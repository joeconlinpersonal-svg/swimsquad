"use client";

import { useState } from "react";
import SwimmerCard from "./SwimmerCard";
import TrendChart from "./TrendChart";
import AddEntryModal from "./AddEntryModal";
import type { SwimmerWithEntries } from "@/lib/types";

export default function Dashboard({ initial }: { initial: SwimmerWithEntries[] }) {
  const [swimmers, setSwimmers] = useState(initial);
  const [modalSwimmerId, setModalSwimmerId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalSwims = swimmers.reduce((n, s) => n + s.entries.length, 0);

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

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          Pace trends · 400m
        </h2>
        <TrendChart swimmers={swimmers} distance={400} />
        <h2 className="mt-2 text-sm font-semibold text-[var(--text-secondary)]">
          Pace trends · 1000m
        </h2>
        <TrendChart swimmers={swimmers} distance={1000} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Swimmers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {swimmers.map((s) => (
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
