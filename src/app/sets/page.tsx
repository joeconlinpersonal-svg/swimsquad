import WeeksPageClient from "@/components/WeeksPageClient";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const weeks = await store.getWeekSets();
  return (
    <div className="min-h-full bg-[var(--background)]">
      <WeeksPageClient initial={weeks} />
    </div>
  );
}
