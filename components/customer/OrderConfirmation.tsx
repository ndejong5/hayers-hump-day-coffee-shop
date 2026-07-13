import type { Order, PublicSettings } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { buildVenmoLink, buildPaypalLink } from "@/lib/paymentLinks";
import { Button } from "@/components/ui/Button";

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
  const note = `${settings.shop_name} - ${order.drink_name_at_order}`;
  const venmoLink =
    order.total_cents > 0 ? buildVenmoLink(settings.venmo_link ?? "", order.total_cents, note) : "";
  const paypalLink =
    order.total_cents > 0 ? buildPaypalLink(settings.paypal_link ?? "", order.total_cents) : "";

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <span className="text-5xl">🎉</span>
      <h2 className="text-2xl font-bold text-amber-900">Order placed!</h2>
      <div className="w-full rounded-2xl bg-white p-4 text-left shadow-sm">
        <p className="font-semibold text-amber-900">
          {order.drink_name_at_order}
          {order.is_reward_redemption && <span className="ml-2 text-sm">🎁 Free</span>}
        </p>
        <p className="mt-1 text-sm text-amber-700">
          {order.payment_method === "cash" ? "Paying with cash at delivery" : "Added to your tab"}
        </p>
        <p className="mt-2 text-lg font-bold text-amber-900">{formatCents(order.total_cents)}</p>
      </div>

      {(venmoLink || paypalLink) && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-xs text-amber-600">Prefer to pay digitally instead?</p>
          {venmoLink && (
            <a
              href={venmoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-2xl border-2 border-amber-300 bg-white px-6 py-3 text-center font-semibold text-amber-900"
            >
              Pay with Venmo
            </a>
          )}
          {paypalLink && (
            <a
              href={paypalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-2xl border-2 border-amber-300 bg-white px-6 py-3 text-center font-semibold text-amber-900"
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
