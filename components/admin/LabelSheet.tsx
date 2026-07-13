"use client";

import { useState } from "react";
import Link from "next/link";
import type { BoardOrder } from "@/lib/types";
import { Label } from "./Label";

const LABELS_PER_SHEET = 10;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function LabelSheet({ orders }: { orders: BoardOrder[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(orders.map((o) => o.id)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const pages = chunk(selectedOrders, LABELS_PER_SHEET);

  return (
    <>
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 print:hidden">
        <Link href="/admin/board" className="text-sm text-amber-700 underline">
          ← Back to board
        </Link>
        <h2 className="font-display text-xl font-bold text-amber-900">🏷️ Print Labels</h2>
        <p className="text-sm text-amber-700">
          Designed for Avery 5163 (2&quot; × 4&quot;, 10 per sheet). Uncheck any orders you
          don&apos;t want printed, then use your browser&apos;s Print (⌘/Ctrl+P).
        </p>

        {orders.length === 0 && <p className="text-amber-700">No orders this week yet.</p>}

        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <label
              key={order.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <input
                type="checkbox"
                checked={selected.has(order.id)}
                onChange={() => toggle(order.id)}
                className="h-5 w-5"
              />
              <span className="font-semibold text-amber-900">{order.customer_name}</span>
              <span className="text-amber-600">— {order.drink_name_at_order}</span>
            </label>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          disabled={selectedOrders.length === 0}
          className="rounded-full bg-orange-500 px-6 py-4 text-lg font-bold text-white shadow-md shadow-orange-900/20 disabled:opacity-40"
        >
          Print {selectedOrders.length} Label{selectedOrders.length === 1 ? "" : "s"}
        </button>
      </main>

      <div className="hidden print:block" style={{ padding: "0.5in 0.15625in" }}>
        {pages.map((page, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "4in 4in",
              gridTemplateRows: "repeat(5, 2in)",
              columnGap: "0.1875in",
              rowGap: "0in",
              pageBreakAfter: i < pages.length - 1 ? "always" : "auto",
            }}
          >
            {page.map((order) => (
              <Label key={order.id} order={order} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
