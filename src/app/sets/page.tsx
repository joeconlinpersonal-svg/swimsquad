import SetsPageClient from "@/components/SetsPageClient";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const sets = await store.getSets();
  return (
    <div className="min-h-full bg-[var(--background)]">
      <SetsPageClient initial={sets} />
    </div>
  );
}
