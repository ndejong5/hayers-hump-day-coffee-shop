"use client";

import { useMemo, useState } from "react";
import type { MenuDrink } from "@/lib/data";
import type { Modifier } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { DrinkIllustration } from "./DrinkIllustration";

const MAX_QUANTITY = 10;

export function ModifierPicker({
  drink,
  modifiers,
  eligibleForReward,
  modifiersChargeOnReward,
  onBack,
  onContinue,
}: {
  drink: MenuDrink;
  modifiers: Modifier[];
  eligibleForReward: boolean;
  modifiersChargeOnReward: boolean;
  onBack: () => void;
  onContinue: (modifierIds: string[], isRedemption: boolean) => void;
}) {
  const applicable = useMemo(
    () => modifiers.filter((m) => drink.modifierIds.includes(m.id)),
    [modifiers, drink]
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [redeem, setRedeem] = useState(false);

  function increment(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, MAX_QUANTITY) }));
  }

  function decrement(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 0) - 1, 0) }));
  }

  const modifierTotal = applicable.reduce(
    (sum, m) => sum + m.price_cents * (quantities[m.id] ?? 0),
    0
  );
  const drinkCost = redeem ? 0 : drink.price_cents;
  const modifierCost = redeem && !modifiersChargeOnReward ? 0 : modifierTotal;
  const total = drinkCost + modifierCost;

  function handleContinue() {
    const modifierIds: string[] = [];
    for (const m of applicable) {
      const qty = quantities[m.id] ?? 0;
      for (let i = 0; i < qty; i++) modifierIds.push(m.id);
    }
    onContinue(modifierIds, redeem);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <button onClick={onBack} className="self-start font-medium text-orange-600">
        ← Back
      </button>

      <DrinkIllustration
        name={drink.name}
        imageUrl={drink.image_url}
        className="aspect-[3/2] w-full shadow-sm"
      />
      <h2 className="font-display text-2xl font-bold text-amber-900">{drink.name}</h2>

      {eligibleForReward && (
        <button
          onClick={() => setRedeem((r) => !r)}
          className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${
            redeem
              ? "border-orange-500 bg-orange-100 text-orange-900"
              : "border-amber-200 bg-white text-amber-900"
          }`}
        >
          🎁 {redeem ? "Redeeming your free drink!" : "Redeem your free drink"}
        </button>
      )}

      {applicable.length > 0 && (
        <div className="flex flex-col gap-2">
          {applicable.map((m) => {
            const qty = quantities[m.id] ?? 0;
            return (
              <div
                key={m.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 transition ${
                  qty > 0 ? "border-orange-500 bg-orange-50" : "border-amber-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="font-medium text-amber-900">{m.name}</p>
                    <p className="text-xs text-orange-600">
                      {m.price_cents > 0 ? `+${formatCents(m.price_cents)} each` : "free"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => decrement(m.id)}
                    disabled={qty === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-300 text-lg font-bold text-amber-900 disabled:opacity-30"
                    aria-label={`Fewer ${m.name}`}
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-lg font-bold text-amber-900">{qty}</span>
                  <button
                    type="button"
                    onClick={() => increment(m.id)}
                    disabled={qty >= MAX_QUANTITY}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-300 text-lg font-bold text-amber-900 disabled:opacity-30"
                    aria-label={`More ${m.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <span className="font-medium text-amber-900">Total</span>
        <span className="text-lg font-bold text-amber-900">{formatCents(total)}</span>
      </div>

      <Button onClick={handleContinue}>Continue</Button>
    </div>
  );
}
