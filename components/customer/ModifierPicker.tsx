"use client";

import { useMemo, useState } from "react";
import type { MenuDrink } from "@/lib/data";
import type { Modifier } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { DrinkIllustration } from "./DrinkIllustration";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [redeem, setRedeem] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const modifierTotal = applicable
    .filter((m) => selected.has(m.id))
    .reduce((sum, m) => sum + m.price_cents, 0);
  const drinkCost = redeem ? 0 : drink.price_cents;
  const modifierCost = redeem && !modifiersChargeOnReward ? 0 : modifierTotal;
  const total = drinkCost + modifierCost;

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
          {applicable.map((m) => (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition ${
                selected.has(m.id)
                  ? "border-orange-500 bg-orange-100"
                  : "border-amber-200 bg-white"
              }`}
            >
              <span className="font-medium text-amber-900">{m.name}</span>
              <span className="text-orange-600">
                {m.price_cents > 0 ? `+${formatCents(m.price_cents)}` : "free"}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <span className="font-medium text-amber-900">Total</span>
        <span className="text-lg font-bold text-amber-900">{formatCents(total)}</span>
      </div>

      <Button onClick={() => onContinue(Array.from(selected), redeem)}>Continue</Button>
    </div>
  );
}
