"use client";

import { useState } from "react";
import Link from "next/link";
import SetEditor from "./SetEditor";
import type { SwimSet } from "@/lib/types";

export default function SetsPageClient({ initial }: { initial: SwimSet[] }) {
  const [sets, setSets] = useState(initial);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create set");
      setSets(data.sets);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">🏋️ Set Builder</h1>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] sm:text-sm">
            {sets.length} set{sets.length === 1 ? "" : "s"} saved
          </p>
        </div>
        <Link
          href="/"
          className="self-start rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
        >
          ← Swim tracker
        </Link>
      </header>

      <form
        onSubmit={handleCreate}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Tuesday sprint set"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="whitespace-nowrap rounded-full bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-[var(--background)] disabled:opacity-50"
        >
          + New set
        </button>
      </form>

      {error && <p className="text-xs text-[#e34948]">{error}</p>}

      {sets.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
          No sets yet — create one above.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sets.map((set) => (
            <SetEditor key={set.id} set={set} onUpdated={setSets} onDeleted={setSets} />
          ))}
        </div>
      )}
    </div>
  );
}
