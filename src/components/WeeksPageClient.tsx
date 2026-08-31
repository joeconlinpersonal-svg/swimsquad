"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LaneTable from "./LaneTable";
import { localToday } from "@/lib/time";
import {
  addDaysISO,
  defaultLaneRows,
  nextWeekToPrep,
  type SetLane,
  type WeekSet,
} from "@/lib/types";

function formatWeekOf(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function WeeksPageClient({ initial }: { initial: WeekSet[] }) {
  const [weeks, setWeeks] = useState(initial);
  const [upcoming, setUpcoming] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draftLanes, setDraftLanes] = useState<SetLane[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve "today" client-side only — the app has no server-side notion of
  // the squad's local time zone, so computing this during SSR would either
  // use the deployment's (likely UTC) clock or mismatch the browser's on
  // hydration. A brief blank state on mount is the trade-off. The page
  // always opens on the upcoming Tuesday, whether or not it has a set yet.
  useEffect(() => {
    // new Date() must not run during render, or SSR (server clock) and
    // hydration (browser clock) will disagree and React will warn/flash.
    const { iso, hour } = localToday();
    const up = nextWeekToPrep(iso, hour);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUpcoming(up);
    setSelected(up);
  }, []);

  const currentWeek = selected ? (weeks.find((w) => w.weekOf === selected) ?? null) : null;
  const needsUpcomingSet = upcoming !== null && !weeks.some((w) => w.weekOf === upcoming);

  const mostRecentBefore = useMemo(() => {
    if (!selected) return null;
    const candidates = weeks.filter((w) => w.weekOf < selected);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.weekOf > b.weekOf ? a : b));
  }, [weeks, selected]);

  function goTo(weekOf: string) {
    setSelected(weekOf);
    setMode("view");
    setDraftLanes(null);
    setError(null);
  }

  async function handleCreate(copyFromWeekOf: string | null) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekOf: selected, copyFromWeekOf }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create week");
      setWeeks(data.weeks);
      const created = (data.weeks as WeekSet[]).find((w) => w.weekOf === selected);
      if (created) {
        setDraftLanes(created.lanes);
        setMode("edit");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    if (!currentWeek) return;
    setDraftLanes(JSON.parse(JSON.stringify(currentWeek.lanes)));
    setMode("edit");
  }

  function cancelEdit() {
    setDraftLanes(null);
    setMode("view");
  }

  async function handleSave() {
    if (!currentWeek || !draftLanes) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/weeks/${currentWeek.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lanes: draftLanes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setWeeks(data.weeks);
      setMode("view");
      setDraftLanes(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!currentWeek) return;
    if (!confirm(`Delete the set for ${formatWeekOf(currentWeek.weekOf)}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/weeks/${currentWeek.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete");
      setWeeks(data.weeks);
      setMode("view");
      setDraftLanes(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  function updateLane(index: number, lane: SetLane) {
    setDraftLanes((d) => (d ? d.map((l, i) => (i === index ? lane : l)) : d));
  }

  function addLane() {
    setDraftLanes((d) =>
      d ? [...d, { name: `Lane ${d.length + 1}`, rows: defaultLaneRows() }] : d
    );
  }

  function removeLane(index: number) {
    setDraftLanes((d) => (d ? d.filter((_, i) => i !== index) : d));
  }

  const displayLanes = mode === "edit" ? draftLanes : (currentWeek?.lanes ?? null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">🏋️ Weekly Sets</h1>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] sm:text-sm">
            Tuesday mornings · {weeks.length} week{weeks.length === 1 ? "" : "s"} recorded
          </p>
        </div>
        <Link
          href="/"
          className="self-start rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
        >
          ← Swim tracker
        </Link>
      </header>

      {!selected ? (
        <div className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : (
        <>
          {needsUpcomingSet && upcoming && (
            <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                🎉 This Tuesday&apos;s swim is done — build the set for{" "}
                <span className="font-semibold">{formatWeekOf(upcoming)}</span>?
              </p>
              <button
                onClick={() => goTo(upcoming)}
                className="whitespace-nowrap rounded-full bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-[var(--background)]"
              >
                Go build it
              </button>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <button
              onClick={() => goTo(addDaysISO(selected, -7))}
              className="rounded-md px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--background)]"
            >
              ← Prev
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold">{formatWeekOf(selected)}</div>
              {selected === upcoming && (
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  Next up
                </div>
              )}
            </div>
            <button
              onClick={() => goTo(addDaysISO(selected, 7))}
              className="rounded-md px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--background)]"
            >
              Next →
            </button>
          </div>

          {error && <p className="text-xs text-[#e34948]">{error}</p>}

          {!currentWeek ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No set yet for {formatWeekOf(selected)}.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {mostRecentBefore && (
                  <button
                    onClick={() => handleCreate(mostRecentBefore.weekOf)}
                    disabled={saving}
                    className="rounded-full bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-[var(--background)] disabled:opacity-50"
                  >
                    Copy from {formatWeekOf(mostRecentBefore.weekOf)}
                  </button>
                )}
                <button
                  onClick={() => handleCreate(null)}
                  disabled={saving}
                  className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Start blank
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-end gap-2">
                {mode === "view" ? (
                  <>
                    <button
                      onClick={startEdit}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[#e34948] disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface)] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-full bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-start gap-3 overflow-x-auto pb-2">
                {displayLanes &&
                  displayLanes.map((lane, i) => (
                    <LaneTable
                      key={i}
                      lane={lane}
                      mode={mode}
                      onChange={mode === "edit" ? (l) => updateLane(i, l) : undefined}
                      onRemoveLane={
                        mode === "edit" && displayLanes.length > 1 ? () => removeLane(i) : undefined
                      }
                    />
                  ))}
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={addLane}
                    className="flex w-56 shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                  >
                    + Lane
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
