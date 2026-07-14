"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOrderForBoard, markDelivered, addExactRule } from "@/app/admin/actions";
import { groupByHallway } from "@/lib/hallways";
import { groupModifierNames } from "@/lib/modifiers";
import { formatCents } from "@/lib/currency";
import type { BoardOrder, Hallway } from "@/lib/types";
import { CustomerAvatar } from "@/components/ui/CustomerAvatar";
import { CashCollectedModal } from "./CashCollectedModal";

export function DeliveryRunSheet({
  initialOrders,
  hallways: initialHallways,
  windowId,
}: {
  initialOrders: BoardOrder[];
  hallways: Hallway[];
  windowId: string;
}) {
  const [orders, setOrders] = useState<BoardOrder[]>(initialOrders);
  const [hallways, setHallways] = useState<Hallway[]>(initialHallways);
  const [pendingCashOrderId, setPendingCashOrderId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`delivery-window-${windowId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_window_id=eq.${windowId}`,
        },
        async (payload) => {
          const updated = payload.new as {
            id: string;
            made_at: string | null;
            delivered_at: string | null;
          };
          if (updated.delivered_at) {
            setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            return;
          }
          if (!updated.made_at) return;
          const full = await fetchOrderForBoard(updated.id);
          if (!full) return;
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === full.id);
            return exists ? prev.map((o) => (o.id === full.id ? full : o)) : [...prev, full];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [windowId]);

  const grouped = useMemo(
    () => groupByHallway(orders.map((o) => ({ ...o, room: o.customer_room })), hallways),
    [orders, hallways]
  );

  async function handleToggleDelivered(order: BoardOrder) {
    if (order.payment_method === "cash") {
      setPendingCashOrderId(order.id);
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    await markDelivered(order.id, null);
  }

  async function resolveCashCollected(collected: boolean) {
    const orderId = pendingCashOrderId;
    setPendingCashOrderId(null);
    if (!orderId) return;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await markDelivered(orderId, collected);
  }

  async function handleAssignHallway(room: string, hallwayId: string) {
    await addExactRule(hallwayId, room);
    setHallways((prev) =>
      prev.map((h) =>
        h.id === hallwayId
          ? {
              ...h,
              rules: [
                ...h.rules,
                {
                  id: `local-${crypto.randomUUID()}`,
                  hallway_id: hallwayId,
                  kind: "exact" as const,
                  range_min: null,
                  range_max: null,
                  exact_value: room,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : h
      )
    );
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 bg-background px-4 py-6 print:max-w-none print:px-0">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <h1 className="font-display text-2xl font-bold text-amber-900">🚚 Delivery Run</h1>
        <Link href="/admin/board" className="text-sm font-medium text-orange-600 underline">
          ← Back to board
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-3xl bg-white px-4 py-3 text-lg font-semibold text-amber-800 shadow-sm print:hidden">
        <span>{orders.length} stops left</span>
        <button
          onClick={handlePrint}
          className="rounded-full border-2 border-orange-300 px-4 py-2 text-sm font-bold text-orange-700"
        >
          🖨️ Print run sheet
        </button>
      </div>

      {orders.length === 0 && (
        <p className="text-center text-amber-700 print:hidden">
          Nothing to deliver right now — made orders will show up here.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <div key={group.hallway?.id ?? "unassigned"} className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-bold text-amber-900">
              {group.hallway ? group.hallway.name : "🤔 Unassigned"}
            </h2>
            {group.items.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm print:break-inside-avoid print:shadow-none"
              >
                <div className="flex items-center gap-3 p-4">
                  <CustomerAvatar
                    name={order.customer_name}
                    photoUrl={order.customer_photo_url}
                    className="h-14 w-14 shrink-0"
                    textClassName="text-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-amber-900">
                      {order.customer_name}
                      {order.customer_room && (
                        <span className="ml-2 text-sm font-normal text-amber-600">
                          Rm {order.customer_room}
                        </span>
                      )}
                    </p>
                    <p className="text-amber-800">
                      {order.drink_name_at_order}
                      {order.modifiers.length > 0 && (
                        <span className="text-sm text-amber-600">
                          {" "}
                          · {groupModifierNames(order.modifiers).join(", ")}
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {order.payment_method === "cash" ? "💵 Cash" : "📒 Tab"}
                      </span>
                      <span className="text-xs font-bold text-orange-600">
                        {formatCents(order.total_cents)}
                      </span>
                    </div>
                  </div>
                </div>

                {!group.hallway && (
                  <div className="border-t border-amber-100 p-3 print:hidden">
                    <AssignHallwayControl
                      hallways={hallways}
                      onAssign={(hallwayId) =>
                        handleAssignHallway(order.customer_room ?? "", hallwayId)
                      }
                    />
                  </div>
                )}

                <button
                  onClick={() => handleToggleDelivered(order)}
                  className="w-full border-t border-amber-100 py-4 text-lg font-bold text-amber-900 transition active:scale-[0.98] print:hidden"
                >
                  🚶 Delivered
                </button>
                <p className="hidden border-t border-amber-100 p-2 text-center text-sm print:block">
                  ☐ Delivered
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {pendingCashOrderId && (
        <CashCollectedModal
          onConfirm={() => resolveCashCollected(true)}
          onDeny={() => resolveCashCollected(false)}
          onCancel={() => setPendingCashOrderId(null)}
        />
      )}
    </main>
  );
}

function AssignHallwayControl({
  hallways,
  onAssign,
}: {
  hallways: Hallway[];
  onAssign: (hallwayId: string) => void;
}) {
  const [selected, setSelected] = useState(hallways[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  if (hallways.length === 0) {
    return <p className="text-sm text-amber-600">Add a hallway in Settings to assign this stop.</p>;
  }

  async function handleClick() {
    if (!selected) return;
    setBusy(true);
    await onAssign(selected);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg border-2 border-amber-200 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
      >
        {hallways.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleClick}
        disabled={busy}
        className="shrink-0 rounded-full border-2 border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-900 disabled:opacity-40"
      >
        Assign
      </button>
    </div>
  );
}
