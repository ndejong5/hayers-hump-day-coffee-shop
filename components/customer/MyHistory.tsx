"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateDeviceId } from "@/lib/device";
import { getMyOrderHistory } from "@/app/actions";
import { formatCents } from "@/lib/currency";
import type { MyOrderLine } from "@/lib/types";
import { PunchCard } from "./PunchCard";

type LoadState = "loading" | "no-customer" | "ready";

export function MyHistory() {
  const [state, setState] = useState<LoadState>("loading");
  const [customerName, setCustomerName] = useState("");
  const [orders, setOrders] = useState<MyOrderLine[]>([]);
  const [tabBalanceCents, setTabBalanceCents] = useState(0);
  const [punchCount, setPunchCount] = useState(0);
  const [rewardPunchesRequired, setRewardPunchesRequired] = useState(10);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    getMyOrderHistory(id).then((result) => {
      if (!result) {
        setState("no-customer");
        return;
      }
      setCustomerName(result.customerName);
      setOrders(result.orders);
      setTabBalanceCents(result.tabBalanceCents);
      setPunchCount(result.punchCount);
      setRewardPunchesRequired(result.rewardPunchesRequired);
      setState("ready");
    });
  }, []);

  if (state === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-amber-50">
        <p className="text-amber-700">Loading...</p>
      </main>
    );
  }

  if (state === "no-customer") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-amber-50 p-6 text-center">
        <p className="text-amber-800">
          We don&apos;t recognize this device yet. Place an order first!
        </p>
        <Link href="/" className="text-amber-700 underline">
          ← Back to menu
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-amber-50 px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-900">☕ My Orders</h1>
      <p className="text-amber-800">Hi {customerName}!</p>

      <div className="w-full max-w-sm rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-sm text-amber-600">Current tab balance</p>
        <p className="text-2xl font-bold text-amber-900">{formatCents(tabBalanceCents)}</p>
      </div>

      <PunchCard punches={punchCount} required={rewardPunchesRequired} />

      <div className="flex w-full max-w-sm flex-col gap-3">
        {orders.length === 0 && (
          <p className="text-center text-amber-700">No orders yet.</p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-amber-900">
                  {o.drink_name_at_order}
                  {o.is_reward_redemption && <span className="ml-2 text-sm">🎁 Free</span>}
                </p>
                {o.modifiers.length > 0 && (
                  <p className="text-sm text-amber-600">
                    {o.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                <p className="text-xs text-amber-500">
                  {new Date(o.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="font-semibold text-amber-900">{formatCents(o.total_cents)}</span>
            </div>
            <p className="mt-2 text-xs text-amber-500">
              {o.delivered_at
                ? "Delivered"
                : o.made_at
                  ? "Made — awaiting delivery"
                  : "Order placed"}
              {o.payment_method === "tab" && (o.settled_at ? " · Settled" : " · On tab")}
            </p>
          </div>
        ))}
      </div>

      <Link href="/" className="text-sm text-amber-600 underline">
        ← Back to menu
      </Link>
    </main>
  );
}
