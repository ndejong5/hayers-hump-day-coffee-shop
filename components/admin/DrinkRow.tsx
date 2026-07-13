import type { Modifier } from "@/lib/types";
import type { MenuDrink } from "@/lib/data";
import { formatCents } from "@/lib/currency";
import { DrinkIllustration } from "@/components/customer/DrinkIllustration";

export function DrinkRow({
  drink,
  modifiers,
  isFirst,
  isLast,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: {
  drink: MenuDrink;
  modifiers: Modifier[];
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const modifierNames = modifiers
    .filter((m) => drink.modifierIds.includes(m.id))
    .map((m) => m.name);

  return (
    <div className={`rounded-3xl bg-white p-4 shadow-sm ${drink.is_active ? "" : "opacity-50"}`}>
      <div className="flex items-start gap-3">
        <DrinkIllustration name={drink.name} className="aspect-square w-16 shrink-0" />
        <div className="flex flex-1 items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg font-bold text-amber-900">{drink.name}</p>
            {drink.description && <p className="text-sm text-amber-700">{drink.description}</p>}
            {modifierNames.length > 0 && (
              <p className="mt-1 text-xs text-amber-600">Modifiers: {modifierNames.join(", ")}</p>
            )}
          </div>
          <span className="font-semibold text-orange-600">{formatCents(drink.price_cents)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="rounded-full border-2 border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900"
        >
          Edit
        </button>
        <button
          onClick={onToggleActive}
          className={`rounded-full border-2 px-3 py-2 text-sm font-semibold ${
            drink.is_active ? "border-red-300 text-red-700" : "border-green-300 text-green-700"
          }`}
        >
          {drink.is_active ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded-full border-2 border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded-full border-2 border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-30"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
