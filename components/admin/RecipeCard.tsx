"use client";

import { useMemo, useState } from "react";
import type { BoardOrder } from "@/lib/types";

interface RecipeUnit {
  key: string;
  icon: string;
  imageUrl: string | null;
  label: string;
}

function RecipeTile({
  unit,
  checked,
  onTap,
}: {
  unit: RecipeUnit;
  checked: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border-4 p-3 text-center shadow-sm transition active:scale-95 ${
        checked ? "border-green-500 bg-green-50" : "border-amber-200 bg-white"
      }`}
    >
      {unit.imageUrl ? (
        <div className="h-20 w-20 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded photo */}
          <img src={unit.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <span className="text-6xl sm:text-7xl">{unit.icon}</span>
      )}
      <span className="font-display text-lg font-bold leading-tight text-amber-900 sm:text-xl">
        {unit.label}
      </span>
      {checked && (
        <span className="animate-check-pop absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg">
          ✓
        </span>
      )}
    </button>
  );
}

export function RecipeCard({
  order,
  onDone,
  onClose,
}: {
  order: BoardOrder;
  onDone: () => void;
  onClose: () => void;
}) {
  const alreadyMade = !!order.made_at;

  const units = useMemo<RecipeUnit[]>(() => {
    const drinkSteps =
      order.drink_prep_steps.length > 0 ? order.drink_prep_steps : [order.drink_name_at_order];
    const drinkUnits: RecipeUnit[] = drinkSteps.map((step, i) => ({
      key: `drink-${i}`,
      icon: order.drink_icon,
      imageUrl: order.drink_image_url,
      label: step,
    }));
    const modifierUnits: RecipeUnit[] = order.modifiers.map((m, i) => ({
      key: `mod-${i}-${m.name}`,
      icon: m.icon,
      imageUrl: m.image_url,
      label: m.instruction || `Add ${m.name}`,
    }));
    return [...drinkUnits, ...modifierUnits];
  }, [order]);

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(alreadyMade ? units.map((u) => u.key) : [])
  );

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allChecked = units.every((u) => checked.has(u.key));

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-white px-4 py-3">
        <button onClick={onClose} className="text-lg font-bold text-orange-600">
          ← Back
        </button>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-amber-900">{order.customer_name}</p>
          {order.customer_room && (
            <p className="text-sm text-amber-600">Rm {order.customer_room}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
          {units.map((unit) => (
            <RecipeTile
              key={unit.key}
              unit={unit}
              checked={checked.has(unit.key)}
              onTap={() => toggle(unit.key)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-amber-200 bg-white p-4">
        <p className="mb-2 text-center text-sm font-semibold text-amber-600">
          {alreadyMade
            ? "Already made ✅"
            : `${checked.size} of ${units.length} steps done`}
        </p>
        <button
          onClick={alreadyMade ? onClose : onDone}
          className={`w-full rounded-full py-5 text-2xl font-bold text-white shadow-md transition active:scale-[0.98] ${
            allChecked || alreadyMade
              ? "bg-orange-500 shadow-orange-900/20"
              : "bg-amber-300 shadow-amber-900/10"
          }`}
        >
          {alreadyMade ? "← Back to board" : "Done! ✅"}
        </button>
      </div>
    </div>
  );
}
