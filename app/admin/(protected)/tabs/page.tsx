import Link from "next/link";
import { getTabSummaries } from "@/lib/data";
import { formatCents } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function TabsPage() {
  const summaries = await getTabSummaries();

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <h2 className="font-display text-xl font-bold text-amber-900">Tabs</h2>

      {summaries.length === 0 && <p className="text-amber-700">No open tabs right now.</p>}

      <div className="flex flex-col gap-3">
        {summaries.map((s) => (
          <Link
            key={s.customer_id}
            href={`/admin/tabs/${s.customer_id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
          >
            <div>
              <p className="text-lg font-semibold text-amber-900">{s.customer_name}</p>
              {s.customer_room && <p className="text-sm text-amber-600">Rm {s.customer_room}</p>}
            </div>
            <span className="text-lg font-bold text-amber-900">
              {formatCents(s.balance_cents)}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
