"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

export default function WaitTracker({ initial }: Props) {
  const [sessions, setSessions] = useState(initial);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - (startRef.current ?? Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [running]);

  function handleStart() {
    startRef.current = Date.now();
    setElapsedMs(0);
    setRunning(true);
    setError(null);
  }

  async function handleStop() {
    if (startRef.current === null) return;
    const seconds = (Date.now() - startRef.current) / 1000;
    startRef.current = null;
    setRunning(false);
    setSaving(true);
    try {
      const res = await fetch("/api/wait-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds, date: todayISO() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save session");
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const total = sessions.reduce((sum, s) => sum + s.seconds, 0);
  const average = sessions.length ? total / sessions.length : 0;

  const chartRows = [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((s) => ({ date: s.date, seconds: s.seconds }));

  const tableRows = [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          Time Slow Joe has waited for the girls to finish showering
        </h2>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:flex-row sm:justify-between">
        <div className="font-mono text-4xl tabular-nums">
          {formatSecondsToTime(running ? elapsedMs / 1000 : 0)}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Total
            </div>
            <div className="font-mono text-lg tabular-nums">{formatSecondsToTime(total)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Average
            </div>
            <div className="font-mono text-lg tabular-nums">{formatSecondsToTime(average)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Sessions
            </div>
            <div className="font-mono text-lg tabular-nums">{sessions.length}</div>
          </div>
        </div>
        {!running ? (
          <button
            onClick={handleStart}
            disabled={saving}
            className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="rounded-full bg-[#e34948] px-5 py-2 text-sm font-medium text-white"
          >
            Stop
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[#e34948]">{error}</p>}

      {chartRows.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDate(d)}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatSecondsToTime(v)}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                width={48}
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
          <table className="w-full min-w-[280px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                >
                  <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
                    {formatDate(s.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right font-mono tabular-nums">
                    {formatSecondsToTime(s.seconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
