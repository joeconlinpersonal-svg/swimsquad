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
    <div className="flex w-56 shrink-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
      <div className="flex items-center gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Set name"
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-xs font-semibold"
        />
        <button
          onClick={handleDelete}
          disabled={saving}
          aria-label="Delete set"
          className="shrink-0 rounded-md px-1 text-xs text-[var(--text-muted)] hover:text-[#e34948] disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-xs"
      />

      <table className="w-full border-collapse text-xs">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-0.5 pr-1">
                <input
                  value={row.label}
                  onChange={(e) => updateLabel(rowIndex, e.target.value)}
                  placeholder="Label"
                  className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[var(--text-secondary)]"
                />
              </td>
              <td className="w-14 py-0.5">
                <input
                  type="number"
                  value={row.distance ?? ""}
                  onChange={(e) => updateDistance(rowIndex, e.target.value)}
                  placeholder="m"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-right font-mono tabular-nums"
                />
              </td>
              <td className="w-4 py-0.5 pl-1 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  className="text-[var(--text-muted)] hover:text-[#e34948]"
                  aria-label="Remove row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={addRow}
        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--background)]"
      >
        + Row
      </button>

      {error && <p className="text-[10px] text-[#e34948]">{error}</p>}

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-1.5">
        <span className="text-xs">
          Total <span className="font-mono font-semibold tabular-nums">{total}m</span>
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[var(--foreground)] px-2.5 py-1 text-[11px] font-medium text-[var(--background)] disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}
