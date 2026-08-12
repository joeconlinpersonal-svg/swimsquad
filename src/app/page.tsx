import Dashboard from "@/components/Dashboard";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const swimmers = await store.getSwimmers();
  return (
    <div className="min-h-full bg-[var(--background)]">
      <Dashboard initial={swimmers} />
    </div>
  );
}
