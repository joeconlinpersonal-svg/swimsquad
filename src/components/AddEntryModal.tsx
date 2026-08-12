"use client";

import { useState } from "react";
import { DISTANCES, type SwimmerWithEntries } from "@/lib/types";

type Props = {
  swimmers: SwimmerWithEntries[];
  initialSwimmerId: string | null;
  onClose: () => void;
  onSaved: (swimmers: SwimmerWithEntries[]) => void;
};

export default function AddEntryModal({ swimmers, initialSwimmerId, onClose, onSaved }: Props) {
  const [swimmerId, setSwimmerId] = useState(initialSwimmerId ?? swimmers[0]?.id ?? "");
  const [newSwimmerName, setNewSwimmerName] = useState("");
  const [isNewSwimmer, setIsNewSwimmer] = useState(swimmers.length === 0 && !initialSwimmerId);
  const [distance, setDistance] = useState<number>(100);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let targetSwimmerId = swimmerId;

      if (isNewSwimmer) {
        const trimmed = newSwimmerName.trim();
        if (!trimmed) {
          setError("Enter a name for the new swimmer.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/swimmers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not add swimmer");
        targetSwimmerId = data.swimmer.id;
      }

      if (!targetSwimmerId) {
        setError("Choose a swimmer.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swimmerId: targetSwimmerId,
          distance,
          time,
          date: date || null,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save swim");
      onSaved(data.swimmers);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Log a swim</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Swimmer</label>
          {!isNewSwimmer ? (
            <div className="flex gap-2">
              <select
                value={swimmerId}
                onChange={(e) => setSwimmerId(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
              >
                {swimmers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsNewSwimmer(true)}
                className="whitespace-nowrap rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--background)]"
              >
                + New
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newSwimmerName}
                onChange={(e) => setNewSwimmerName(e.target.value)}
                placeholder="Swimmer name"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
              />
              {swimmers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsNewSwimmer(false)}
                  className="whitespace-nowrap rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--background)]"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Distance</label>
          <div className="flex flex-wrap gap-1.5">
            {DISTANCES.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDistance(d)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  distance === d
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]"
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Time (mm:ss)
            </label>
            <input
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="1:25"
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Date (optional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Note (optional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. @ 2:00 send-off"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
          />
        </div>

        {error && <p className="text-xs text-[#e34948]">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save swim"}
        </button>
      </form>
    </div>
  );
}
