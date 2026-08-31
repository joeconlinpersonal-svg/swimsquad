"use client";

import { useState } from "react";
import Spinner from "./Spinner";
import type { Entry, SwimmerWithEntries } from "@/lib/types";

const INTERVAL_OPTIONS = ["@1:00", "@1:30", "@2:00", "@2:30", "@3:00", "@3:30", "@4:00"];
const SHORT_DISTANCES = new Set([50, 100, 200]);

type Props = {
  entry: Entry;
  swimmerName: string;
  onClose: () => void;
  onSaved: (swimmers: SwimmerWithEntries[]) => void;
  onDeleted: (swimmers: SwimmerWithEntries[], entry: Entry, swimmerName: string) => void;
};

export default function EditEntryModal({ entry, swimmerName, onClose, onSaved, onDeleted }: Props) {
  const [time, setTime] = useState(secondsToInput(entry.timeSeconds));
  const [date, setDate] = useState(entry.date ?? "");
  const [note, setNote] = useState(entry.note ?? "");
  const [customInterval, setCustomInterval] = useState(
    !!entry.note && !INTERVAL_OPTIONS.includes(entry.note)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time, date: date || null, note: note || null }),
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

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete swim");
      onDeleted(data.swimmers, entry, swimmerName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
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
          <h2 className="text-base font-semibold">
            Edit {swimmerName} · {entry.distance}m
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Time (mm:ss)
            </label>
            <input
              required
              autoFocus
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

        {SHORT_DISTANCES.has(entry.distance) ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Interval (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setNote("");
                  setCustomInterval(false);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  !customInterval && note === ""
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]"
                }`}
              >
                None
              </button>
              {INTERVAL_OPTIONS.map((interval) => (
                <button
                  type="button"
                  key={interval}
                  onClick={() => {
                    setNote(interval);
                    setCustomInterval(false);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    !customInterval && note === interval
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]"
                  }`}
                >
                  {interval}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCustomInterval(true);
                  setNote((n) => (INTERVAL_OPTIONS.includes(n) ? "" : n));
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  customInterval
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]"
                }`}
              >
                Custom
              </button>
            </div>
            {customInterval && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[var(--text-secondary)]">@</span>
                <input
                  value={note.replace(/^@/, "")}
                  onChange={(e) => setNote(e.target.value ? `@${e.target.value}` : "")}
                  placeholder="1:15"
                  className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm font-mono"
                />
                <span className="text-xs text-[var(--text-muted)]">send-off interval</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. felt strong on the back half"
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
            />
          </div>
        )}

        {error && <p className="text-xs text-[#e34948]">{error}</p>}

        <div className="mt-1 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || deleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[#e34948] disabled:opacity-50"
          >
            {deleting && <Spinner />}
            {deleting ? "" : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}

function secondsToInput(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}
