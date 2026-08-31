"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Spinner from "./Spinner";
import UndoToast from "./UndoToast";
import { formatDate, formatSecondsToTime } from "@/lib/time";
import type { WaitSession } from "@/lib/types";

type Props = {
  initial: WaitSession[];
};

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function parseInputTime(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map(Number);
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

export default function WaitTracker({ initial }: Props) {
  const [sessions, setSessions] = useState(initial);
  const [newTime, setNewTime] = useState("");
  const [newDate, setNewDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editDate, setEditDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [undoSession, setUndoSession] = useState<WaitSession | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const seconds = parseInputTime(newTime);
    if (seconds === null || seconds <= 0) {
      setError("Enter a time like 6:55");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/wait-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds, date: newDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save session");
      setSessions(data.sessions);
      setNewTime("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: WaitSession) {
    setEditingId(s.id);
    setEditTime(formatSecondsToTime(s.seconds));
    setEditDate(s.date);
  }

  async function saveEdit(id: string) {
    const seconds = parseInputTime(editTime);
    if (seconds === null || seconds <= 0) {
      setError("Enter a time like 6:55");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/wait-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds, date: editDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save session");
      setSessions(data.sessions);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(session: WaitSession) {
    setDeletingId(session.id);
    setError(null);
    try {
      const res = await fetch(`/api/wait-sessions/${session.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete session");
      setSessions(data.sessions);
      setEditingId(null);
      setUndoSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  }

  async function restoreSession() {
    if (!undoSession) return;
    const { seconds, date } = undoSession;
    setUndoSession(null);
    const res = await fetch("/api/wait-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds, date }),
    });
    const data = await res.json();
    if (res.ok) setSessions(data.sessions);
  }

  const total = sessions.reduce((sum, s) => sum + s.seconds, 0);
  const average = sessions.length ? total / sessions.length : 0;
  const earliestDate = sessions.reduce(
    (min, s) => (min === null || s.date < min ? s.date : min),
    null as string | null
  );

  const chartRows = [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((s) => ({ date: s.date, seconds: s.seconds }));

  const tableRows = [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          Time Slow Joe has waited for the girls to finish showering
          {earliestDate && (
            <span className="font-normal text-[var(--text-muted)]">
              {" "}
              (since {formatDate(earliestDate)})
            </span>
          )}
        </h2>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] sm:text-xs">
              Total
            </div>
            <div className="font-mono text-base tabular-nums sm:text-lg">
              {formatSecondsToTime(total)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] sm:text-xs">
              Average
            </div>
            <div className="font-mono text-base tabular-nums sm:text-lg">
              {formatSecondsToTime(average)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] sm:text-xs">
              Sessions
            </div>
            <div className="font-mono text-base tabular-nums sm:text-lg">{sessions.length}</div>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
          />
          <input
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            placeholder="6:55"
            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm font-mono"
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-[var(--background)] disabled:opacity-50"
          >
            {saving && <Spinner />}
            {saving ? "Adding…" : "+ Add"}
          </button>
        </form>
      </div>

      {error && <p className="text-xs text-[#e34948]">{error}</p>}

      {chartRows.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDate(d)}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatSecondsToTime(v)}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelFormatter={(d) => formatDate(String(d))}
                formatter={(value) => [formatSecondsToTime(Number(value)), "Wait"]}
              />
              <Bar dataKey="seconds" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tableRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[260px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)] sm:text-xs">
                <th className="px-2.5 py-1.5 font-medium sm:px-3 sm:py-2">Date</th>
                <th className="px-2.5 py-1.5 text-right font-medium sm:px-3 sm:py-2">Duration</th>
                <th className="w-8 px-1 py-1.5 sm:px-2" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-2.5 py-1 sm:px-3 sm:py-1.5">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-xs"
                      />
                    </td>
                    <td className="px-2.5 py-1 sm:px-3 sm:py-1.5">
                      <input
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        placeholder="6:55"
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-right font-mono text-xs"
                      />
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 text-right sm:px-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(s.id)}
                        disabled={saving || deletingId === s.id}
                        className="inline-flex items-center gap-1 px-1 text-[10px] font-medium text-[var(--foreground)] disabled:opacity-50 sm:text-xs"
                      >
                        {saving && <Spinner />}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        disabled={saving || deletingId === s.id}
                        className="inline-flex items-center gap-1 px-1 text-[10px] text-[var(--text-muted)] hover:text-[#e34948] disabled:opacity-50 sm:text-xs"
                      >
                        {deletingId === s.id && <Spinner />}
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-1 text-[10px] text-[var(--text-muted)] sm:text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                  >
                    <td className="whitespace-nowrap px-2.5 py-1 text-[var(--text-secondary)] sm:px-3 sm:py-1.5">
                      {formatDate(s.date)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-1 text-right font-mono tabular-nums sm:px-3 sm:py-1.5">
                      {formatSecondsToTime(s.seconds)}
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 text-right sm:px-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="rounded-md px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] sm:text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {undoSession && (
        <UndoToast
          message={`Deleted ${formatDate(undoSession.date)}'s wait (${formatSecondsToTime(undoSession.seconds)})`}
          onUndo={restoreSession}
          onDismiss={() => setUndoSession(null)}
        />
      )}
    </section>
  );
}
