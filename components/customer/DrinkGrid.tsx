import type { MenuDrink } from "@/lib/data";
import { formatCents } from "@/lib/currency";
import { DrinkIllustration } from "./DrinkIllustration";

export function DrinkGrid({
  drinks,
  disabled,
  onSelect,
}: {
  drinks: MenuDrink[];
  disabled: boolean;
  onSelect: (drink: MenuDrink) => void;
}) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4">
      {drinks.map((drink) => (
        <button
          key={drink.id}
          disabled={disabled}
          onClick={() => onSelect(drink)}
          className="flex flex-col items-start overflow-hidden rounded-3xl border-2 border-amber-200 bg-white text-left shadow-sm transition active:scale-[0.97] disabled:opacity-40"
        >
          <div className="relative w-full">
            <DrinkIllustration
              name={drink.name}
              imageUrl={drink.image_url}
              className="aspect-square w-full rounded-none"
            />
            <span className="absolute bottom-2 right-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-orange-600 shadow">
              {formatCents(drink.price_cents)}
            </span>
          </div>
          <div className="p-3">
            <span className="font-display block text-lg font-bold text-amber-900">
              {drink.name}
            </span>
            {drink.description && (
              <span className="text-sm text-amber-700">{drink.description}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
