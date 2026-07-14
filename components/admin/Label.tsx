import type { BoardOrder } from "@/lib/types";
import { groupModifierNames } from "@/lib/modifiers";
import { CustomerAvatar } from "@/components/ui/CustomerAvatar";
import { DrinkIllustration } from "@/components/customer/DrinkIllustration";

export function Label({ order }: { order: BoardOrder }) {
  return (
    <div
      className="flex items-stretch gap-3 overflow-hidden p-3"
      style={{ width: "4in", height: "2in", boxSizing: "border-box" }}
    >
      <CustomerAvatar
        name={order.customer_name}
        photoUrl={order.customer_photo_url}
        className="h-[1.5in] w-[1.5in] shrink-0"
        textClassName="text-5xl"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="truncate text-2xl font-bold leading-tight text-black">
          {order.customer_name}
        </p>
        {order.customer_room && (
          <p className="text-base font-semibold text-neutral-600">Rm {order.customer_room}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <DrinkIllustration
            name={order.drink_name_at_order}
            imageUrl={order.drink_image_url}
            className="h-10 w-10 shrink-0"
          />
          <p className="truncate text-lg font-semibold text-black">
            {order.drink_name_at_order}
            {order.is_reward_redemption && " 🎁"}
          </p>
        </div>
        {order.modifiers.length > 0 && (
          <p className="truncate text-sm text-neutral-600">
            {groupModifierNames(order.modifiers).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
