import type { MenuDrink } from "@/lib/data";
import { formatCents } from "@/lib/currency";

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
    <div className="grid w-full max-w-sm grid-cols-1 gap-3 sm:grid-cols-2">
      {drinks.map((drink) => (
        <button
          key={drink.id}
          disabled={disabled}
          onClick={() => onSelect(drink)}
          className="flex flex-col items-start gap-1 rounded-2xl border-2 border-amber-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98] disabled:opacity-40"
        >
          <span className="text-lg font-semibold text-amber-900">{drink.name}</span>
          {drink.description && (
            <span className="text-sm text-amber-700">{drink.description}</span>
          )}
          <span className="mt-1 font-medium text-amber-600">
            {formatCents(drink.price_cents)}
          </span>
        </button>
      ))}
    </div>
  );
}
