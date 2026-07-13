"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOrderForBoard, markMade, markDelivered } from "@/app/admin/actions";
import type { BoardOrder } from "@/lib/types";
import { OrderCard } from "./OrderCard";
import { CashCollectedModal } from "./CashCollectedModal";
import { PushNotificationToggle } from "./PushNotificationToggle";

export function OrderBoard({
  initialOrders,
  windowId,
}: {
  initialOrders: BoardOrder[];
  windowId: string;
}) {
  const [orders, setOrders] = useState<BoardOrder[]>(initialOrders);
  const [pendingCashOrderId, setPendingCashOrderId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`orders-window-${windowId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `order_window_id=eq.${windowId}`,
        },
        async (payload) => {
          const fullOrder = await fetchOrderForBoard(payload.new.id as string);
          if (fullOrder) {
            setOrders((prev) =>
              prev.some((o) => o.id === fullOrder.id) ? prev : [...prev, fullOrder]
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_window_id=eq.${windowId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            made_at: string | null;
            delivered_at: string | null;
            cash_collected: boolean | null;
          };
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? {
                    ...o,
                    made_at: updated.made_at,
                    delivered_at: updated.delivered_at,
                    cash_collected: updated.cash_collected,
                  }
                : o
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [windowId]);

  const sorted = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const aDone = a.delivered_at ? 1 : 0;
        const bDone = b.delivered_at ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.created_at.localeCompare(b.created_at);
      }),
    [orders]
  );

  async function handleToggleMade(order: BoardOrder) {
    if (order.made_at) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, made_at: new Date().toISOString() } : o))
    );
    await markMade(order.id);
  }

  async function handleToggleDelivered(order: BoardOrder) {
    if (order.delivered_at) return;
    if (order.payment_method === "cash") {
      setPendingCashOrderId(order.id);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, delivered_at: new Date().toISOString() } : o))
    );
    await markDelivered(order.id, null);
  }

  async function resolveCashCollected(collected: boolean) {
    const orderId = pendingCashOrderId;
    setPendingCashOrderId(null);
    if (!orderId) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, delivered_at: new Date().toISOString(), cash_collected: collected }
          : o
      )
    );
    await markDelivered(orderId, collected);
  }

  const madeCount = orders.filter((o) => o.made_at).length;
  const deliveredCount = orders.filter((o) => o.delivered_at).length;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 bg-background px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold text-amber-900">☕ Order Board</h1>
        <PushNotificationToggle />
      </div>

      <div className="rounded-3xl bg-white px-4 py-3 text-center text-lg font-semibold text-amber-800 shadow-sm">
        {orders.length} orders · {madeCount} made · {deliveredCount} delivered
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-amber-700">No orders yet this week.</p>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onToggleMade={() => handleToggleMade(order)}
            onToggleDelivered={() => handleToggleDelivered(order)}
          />
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
