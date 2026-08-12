import Dashboard from "@/components/Dashboard";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [swimmers, waitSessions] = await Promise.all([
    store.getSwimmers(),
    store.getWaitSessions(),
  ]);
  return (
    <div className="min-h-full bg-[var(--background)]">
      <Dashboard initial={swimmers} initialWaitSessions={waitSessions} />
    </div>
  );
}
