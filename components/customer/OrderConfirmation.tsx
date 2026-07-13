import type { Order } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { Button } from "@/components/ui/Button";

export function OrderConfirmation({
  order,
  canOrderAgain,
  onOrderAgain,
}: {
  order: Order;
  canOrderAgain: boolean;
  onOrderAgain: () => void;
}) {
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
      <p className="text-sm text-amber-700">Your coffee will be delivered Wednesday. ☕</p>
      {canOrderAgain && (
        <Button variant="secondary" onClick={onOrderAgain}>
          Place another order
        </Button>
      )}
    </div>
  );
}
