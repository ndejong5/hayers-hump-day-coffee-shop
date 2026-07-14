"use client";

import { useEffect, useState } from "react";
import type { Order, PublicSettings } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { buildVenmoLink, buildPaypalLink } from "@/lib/paymentLinks";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { DrinkIllustration } from "./DrinkIllustration";
import { OrderStatusStepper } from "./OrderStatusStepper";

export function OrderConfirmation({
  order,
  settings,
  canOrderAgain,
  onOrderAgain,
}: {
  order: Order;
  settings: PublicSettings;
  canOrderAgain: boolean;
  onOrderAgain: () => void;
}) {
  const [madeAt, setMadeAt] = useState(order.made_at);
  const [deliveredAt, setDeliveredAt] = useState(order.delivered_at);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`order-status-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const row = payload.new as { made_at: string | null; delivered_at: string | null };
          setMadeAt(row.made_at);
          setDeliveredAt(row.delivered_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const grandTotal = order.total_cents + order.tip_cents;
  const note = `${settings.shop_name} - ${order.drink_name_at_order}`;
  const venmoLink =
    grandTotal > 0 ? buildVenmoLink(settings.venmo_link ?? "", grandTotal, note) : "";
  const paypalLink =
    grandTotal > 0 ? buildPaypalLink(settings.paypal_link ?? "", grandTotal) : "";

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <div className="relative w-40">
        <DrinkIllustration name={order.drink_name_at_order} className="aspect-square w-40 shadow-md" />
        <span className="absolute -right-2 -top-2 text-4xl">🎉</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-amber-900">Order placed!</h2>

      <div className="w-full rounded-3xl bg-white p-4 shadow-sm">
        <OrderStatusStepper madeAt={madeAt} deliveredAt={deliveredAt} />
      </div>

      <div className="w-full rounded-3xl bg-white p-4 text-left shadow-sm">
        <p className="font-semibold text-amber-900">
          {order.drink_name_at_order}
          {order.is_reward_redemption && <span className="ml-2 text-sm">🎁 Free</span>}
        </p>
        <p className="mt-1 text-sm text-amber-700">
          {order.payment_method === "cash" ? "Paying with cash at delivery" : "Added to your tab"}
        </p>
        {order.tip_cents > 0 ? (
          <>
            <p className="mt-2 text-sm text-amber-700">
              {formatCents(order.total_cents)} + {formatCents(order.tip_cents)} tip
            </p>
            <p className="text-lg font-bold text-amber-900">{formatCents(grandTotal)}</p>
          </>
        ) : (
          <p className="mt-2 text-lg font-bold text-amber-900">{formatCents(grandTotal)}</p>
        )}
        {order.note && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            📝 {order.note}
          </p>
        )}
      </div>

      {(venmoLink || paypalLink) && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-xs text-amber-600">Prefer to pay digitally instead?</p>
          {venmoLink && (
            <a
              href={venmoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full border-2 border-amber-300 bg-white px-6 py-3 text-center font-semibold text-amber-900"
            >
              Pay with Venmo
            </a>
          )}
          {paypalLink && (
            <a
              href={paypalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full border-2 border-amber-300 bg-white px-6 py-3 text-center font-semibold text-amber-900"
            >
              Pay with PayPal
            </a>
          )}
        </div>
      )}

      <p className="text-sm text-amber-700">Your coffee will be delivered Wednesday. ☕</p>
      {canOrderAgain && (
        <Button variant="secondary" onClick={onOrderAgain}>
          Place another order
        </Button>
      )}
    </div>
  );
}
