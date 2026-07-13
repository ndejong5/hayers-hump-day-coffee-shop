import type { BoardOrder } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { DrinkIllustration } from "@/components/customer/DrinkIllustration";

export function OrderCard({
  order,
  onToggleMade,
  onToggleDelivered,
}: {
  order: BoardOrder;
  onToggleMade: () => void;
  onToggleDelivered: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <DrinkIllustration
          name={order.drink_name_at_order}
          className="aspect-square w-24 shrink-0 sm:w-28"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold text-amber-900">
            {order.customer_name}
            {order.customer_room && (
              <span className="ml-2 text-sm font-normal text-amber-600">
                Rm {order.customer_room}
              </span>
            )}
          </p>
          <p className="text-lg text-amber-800">{order.drink_name_at_order}</p>
          {order.modifiers.length > 0 && (
            <p className="text-sm text-amber-600">
              {order.modifiers.map((m) => m.name).join(", ")}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              {order.payment_method === "cash" ? "💵 Cash" : "📒 Tab"}
            </span>
            {order.is_reward_redemption && (
              <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-800">
                🎁 Free
              </span>
            )}
            <span className="text-sm font-bold text-orange-600">
              {formatCents(order.total_cents)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-amber-100 p-3">
        <button
          onClick={onToggleMade}
          disabled={!!order.made_at}
          className={`flex-1 rounded-2xl border-2 py-4 text-lg font-bold transition ${
            order.made_at
              ? "border-green-500 bg-green-100 text-green-800"
              : "border-amber-300 bg-white text-amber-900 active:scale-[0.97]"
          }`}
        >
          {order.made_at ? "✅ Made" : "☕ Made"}
        </button>
        <button
          onClick={onToggleDelivered}
          disabled={!!order.delivered_at}
          className={`flex-1 rounded-2xl border-2 py-4 text-lg font-bold transition ${
            order.delivered_at
              ? "border-green-500 bg-green-100 text-green-800"
              : "border-amber-300 bg-white text-amber-900 active:scale-[0.97]"
          }`}
        >
          {order.delivered_at ? "✅ Delivered" : "🚶 Delivered"}
        </button>
      </div>

      {order.payment_method === "cash" && order.delivered_at && (
        <p className="border-t border-amber-100 px-4 py-2 text-xs text-amber-600">
          Cash collected: {order.cash_collected ? "Yes" : "No"}
        </p>
      )}
    </div>
  );
}
