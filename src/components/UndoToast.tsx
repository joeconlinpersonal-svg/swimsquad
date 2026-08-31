"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
};

export default function UndoToast({ message, onUndo, onDismiss, durationMs = 6000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--foreground)] px-4 py-2 text-sm text-[var(--background)] shadow-lg">
        <span>{message}</span>
        <button
          type="button"
          onClick={onUndo}
          className="font-semibold underline underline-offset-2"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
