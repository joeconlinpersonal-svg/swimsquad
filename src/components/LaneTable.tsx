"use client";

import type { Lane, SetRow } from "@/lib/types";

type Props = {
  lane: Lane;
  rows: SetRow[];
  mode: "view" | "edit";
  onChange?: (rows: SetRow[]) => void;
};

export default function LaneTable({ lane, rows, mode, onChange }: Props) {
  const total = rows.reduce((sum, r) => sum + (r.distance ?? 0), 0);

  function updateLabel(rowIndex: number, value: string) {
    onChange?.(rows.map((r, i) => (i === rowIndex ? { ...r, label: value } : r)));
  }

  function updateDistance(rowIndex: number, raw: string) {
    const distance = raw.trim() === "" ? null : Number(raw);
    onChange?.(rows.map((r, i) => (i === rowIndex ? { ...r, distance } : r)));
  }

  function addRow() {
    onChange?.([...rows, { label: "", distance: null }]);
  }

  function removeRow(rowIndex: number) {
    onChange?.(rows.filter((_, i) => i !== rowIndex));
  }

  return (
    <div className="flex w-56 shrink-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
      <h3 className="text-xs font-semibold">{lane}</h3>

      {mode === "view" ? (
        <table className="w-full border-collapse text-xs">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="py-1 pr-1 text-[var(--text-secondary)]">{row.label || "—"}</td>
                <td className="w-12 py-1 text-right font-mono tabular-nums">
                  {row.distance ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
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
      )}

      {mode === "edit" && (
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--background)]"
        >
          + Row
        </button>
      )}

      <p className="border-t border-[var(--border)] pt-1.5 text-xs">
        Total <span className="font-mono font-semibold tabular-nums">{total}m</span>
      </p>
    </div>
  );
}
