"use client";

import { useState } from "react";
import type { SetRow, SwimSet } from "@/lib/types";

type Props = {
  set: SwimSet;
  onUpdated: (sets: SwimSet[]) => void;
  onDeleted: (sets: SwimSet[]) => void;
};

export default function SetEditor({ set, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(set.name);
  const [date, setDate] = useState(set.date ?? "");
  const [rows, setRows] = useState<SetRow[]>(set.rows);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLabel(rowIndex: number, value: string) {
    setRows((rs) => rs.map((r, i) => (i === rowIndex ? { ...r, label: value } : r)));
  }

  function updateDistance(rowIndex: number, raw: string) {
    const distance = raw.trim() === "" ? null : Number(raw);
    setRows((rs) => rs.map((r, i) => (i === rowIndex ? { ...r, distance } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, { label: "", distance: null }]);
  }

  function removeRow(rowIndex: number) {
    setRows((rs) => rs.filter((_, i) => i !== rowIndex));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date: date || null, rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save set");
      onUpdated(data.sets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sets/${set.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete set");
      onDeleted(data.sets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const total = rows.reduce((sum, r) => sum + (r.distance ?? 0), 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Set name"
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm font-semibold"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[#e34948] disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-[#e34948]">{error}</p>}

      <div className="flex flex-col gap-1">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2">
            <input
              value={row.label}
              onChange={(e) => updateLabel(rowIndex, e.target.value)}
              placeholder="Label (e.g. Warm up, Drill, Main set)"
              className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--text-secondary)]"
            />
            <input
              type="number"
              value={row.distance ?? ""}
              onChange={(e) => updateDistance(rowIndex, e.target.value)}
              placeholder="m"
              className="w-20 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-right font-mono text-sm tabular-nums"
            />
            <button
              type="button"
              onClick={() => removeRow(rowIndex)}
              className="shrink-0 px-1 text-[var(--text-muted)] hover:text-[#e34948]"
              aria-label="Remove row"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--background)]"
        >
          + Row
        </button>
        <p className="text-sm">
          Total:{" "}
          <span className="font-mono font-semibold tabular-nums">{total}m</span>
        </p>
      </div>
    </div>
  );
}
