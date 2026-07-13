import type { BoardOrder } from "@/lib/types";
import { formatCents } from "@/lib/currency";

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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-amber-900">
            {order.customer_name}
            {order.customer_room && (
              <span className="ml-2 text-sm font-normal text-amber-600">
                Rm {order.customer_room}
              </span>
            )}
          </p>
          <p className="text-amber-800">{order.drink_name_at_order}</p>
          {order.modifiers.length > 0 && (
            <p className="text-sm text-amber-600">
              {order.modifiers.map((m) => m.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            {order.payment_method === "cash" ? "💵 Cash" : "📒 Tab"}
          </span>
          {order.is_reward_redemption && (
            <span className="rounded-full bg-pink-100 px-2 py-1 text-xs font-medium text-pink-800">
              🎁 Free
            </span>
          )}
          <span className="text-sm font-semibold text-amber-900">
            {formatCents(order.total_cents)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onToggleMade}
          disabled={!!order.made_at}
          className={`flex-1 rounded-xl border-2 px-3 py-3 font-semibold transition ${
            order.made_at
              ? "border-green-500 bg-green-100 text-green-800"
              : "border-amber-300 bg-white text-amber-900"
          }`}
        >
          {order.made_at ? "✓ Made" : "Made"}
        </button>
        <button
          onClick={onToggleDelivered}
          disabled={!!order.delivered_at}
          className={`flex-1 rounded-xl border-2 px-3 py-3 font-semibold transition ${
            order.delivered_at
              ? "border-green-500 bg-green-100 text-green-800"
              : "border-amber-300 bg-white text-amber-900"
          }`}
        >
          {order.delivered_at ? "✓ Delivered" : "Delivered"}
        </button>
      </div>

      {order.payment_method === "cash" && order.delivered_at && (
        <p className="mt-2 text-xs text-amber-600">
          Cash collected: {order.cash_collected ? "Yes" : "No"}
        </p>
      )}
    </div>
  );
}
