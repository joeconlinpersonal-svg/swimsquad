"use client";

import { useState } from "react";
import type { SetGrid, SwimSet } from "@/lib/types";

type Props = {
  set: SwimSet;
  onUpdated: (sets: SwimSet[]) => void;
  onDeleted: (sets: SwimSet[]) => void;
};

export default function SetEditor({ set, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(set.name);
  const [date, setDate] = useState(set.date ?? "");
  const [grid, setGrid] = useState<SetGrid>(set.grid);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateColumnLabel(colIndex: number, value: string) {
    setGrid((g) => ({
      ...g,
      columns: g.columns.map((c, i) => (i === colIndex ? value : c)),
    }));
  }

  function addColumn() {
    setGrid((g) => ({
      columns: [...g.columns, String(g.columns.length + 1)],
      rows: g.rows.map((r) => ({ ...r, values: [...r.values, null] })),
    }));
  }

  function removeColumn(colIndex: number) {
    setGrid((g) => ({
      columns: g.columns.filter((_, i) => i !== colIndex),
      rows: g.rows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== colIndex) })),
    }));
  }

  function updateRowLabel(rowIndex: number, value: string) {
    setGrid((g) => ({
      ...g,
      rows: g.rows.map((r, i) => (i === rowIndex ? { ...r, label: value } : r)),
    }));
  }

  function updateCell(rowIndex: number, colIndex: number, raw: string) {
    const value = raw.trim() === "" ? null : Number(raw);
    setGrid((g) => ({
      ...g,
      rows: g.rows.map((r, i) =>
        i === rowIndex
          ? { ...r, values: r.values.map((v, j) => (j === colIndex ? value : v)) }
          : r
      ),
    }));
  }

  function addRow() {
    setGrid((g) => ({
      ...g,
      rows: [...g.rows, { label: "", values: g.columns.map(() => null) }],
    }));
  }

  function removeRow(rowIndex: number) {
    setGrid((g) => ({ ...g, rows: g.rows.filter((_, i) => i !== rowIndex) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date: date || null, grid }),
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

  const columnTotals = grid.columns.map((_, colIndex) =>
    grid.rows.reduce((sum, r) => sum + (r.values[colIndex] ?? 0), 0)
  );
  const grandTotal = columnTotals.reduce((a, b) => a + b, 0);

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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="w-28 px-1 py-1 text-left sm:w-36" />
              {grid.columns.map((col, colIndex) => (
                <th key={colIndex} className="px-1 py-1">
                  <div className="flex items-center gap-1">
                    <input
                      value={col}
                      onChange={(e) => updateColumnLabel(colIndex, e.target.value)}
                      className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-center font-medium"
                    />
                    {grid.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(colIndex)}
                        className="text-[var(--text-muted)] hover:text-[#e34948]"
                        aria-label={`Remove column ${col}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-6 px-1 py-1">
                <button
                  type="button"
                  onClick={addColumn}
                  className="rounded-md border border-[var(--border)] px-1.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--background)]"
                  aria-label="Add column"
                >
                  +
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-[var(--border)]">
                <td className="px-1 py-1">
                  <input
                    value={row.label}
                    onChange={(e) => updateRowLabel(rowIndex, e.target.value)}
                    placeholder="Label"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[var(--text-secondary)]"
                  />
                </td>
                {row.values.map((value, colIndex) => (
                  <td key={colIndex} className="px-1 py-1">
                    <input
                      type="number"
                      value={value ?? ""}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-right font-mono tabular-nums"
                    />
                  </td>
                ))}
                <td className="px-1 py-1 text-center">
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
            <tr className="border-t border-[var(--border)] font-semibold">
              <td className="px-1 py-1.5">
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-normal text-[var(--text-secondary)] hover:bg-[var(--background)]"
                >
                  + Row
                </button>
              </td>
              {columnTotals.map((total, i) => (
                <td key={i} className="px-1 py-1.5 text-right font-mono tabular-nums">
                  {total}
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Total distance:{" "}
        <span className="font-mono font-semibold text-[var(--foreground)]">{grandTotal}m</span>
      </p>
    </div>
  );
}
