"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Modifier } from "@/lib/types";
import type { MenuDrink } from "@/lib/data";
import {
  createDrink,
  updateDrink,
  setDrinkActive,
  setDrinkModifiers,
  moveDrink,
  createModifier,
  updateModifier,
  setModifierActive,
  moveModifier,
} from "@/app/admin/actions";
import { DrinkRow } from "./DrinkRow";
import { ModifierRow } from "./ModifierRow";
import { DrinkFormModal } from "./DrinkFormModal";
import { ModifierFormModal } from "./ModifierFormModal";

export function MenuManager({
  drinks,
  modifiers,
}: {
  drinks: MenuDrink[];
  modifiers: Modifier[];
}) {
  const router = useRouter();
  const [editingDrink, setEditingDrink] = useState<MenuDrink | "new" | null>(null);
  const [editingModifier, setEditingModifier] = useState<Modifier | "new" | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleSaveDrink(input: {
    name: string;
    description: string;
    price_cents: number;
    modifierIds: string[];
  }) {
    if (editingDrink === "new") {
      const id = await createDrink(input);
      await setDrinkModifiers(id, input.modifierIds);
    } else if (editingDrink) {
      await updateDrink(editingDrink.id, input);
      await setDrinkModifiers(editingDrink.id, input.modifierIds);
    }
    setEditingDrink(null);
    refresh();
  }

  async function handleSaveModifier(input: { name: string; price_cents: number }) {
    if (editingModifier === "new") {
      await createModifier(input);
    } else if (editingModifier) {
      await updateModifier(editingModifier.id, input);
    }
    setEditingModifier(null);
    refresh();
  }

  async function handleToggleDrinkActive(drink: MenuDrink) {
    await setDrinkActive(drink.id, !drink.is_active);
    refresh();
  }

  async function handleMoveDrink(id: string, direction: "up" | "down") {
    await moveDrink(id, direction);
    refresh();
  }

  async function handleToggleModifierActive(modifier: Modifier) {
    await setModifierActive(modifier.id, !modifier.is_active);
    refresh();
  }

  async function handleMoveModifier(id: string, direction: "up" | "down") {
    await moveModifier(id, direction);
    refresh();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-900">Drinks</h2>
          <button
            onClick={() => setEditingDrink("new")}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
          >
            + Add Drink
          </button>
        </div>
        {drinks.length === 0 && <p className="text-amber-700">No drinks yet.</p>}
        {drinks.map((drink, index) => (
          <DrinkRow
            key={drink.id}
            drink={drink}
            modifiers={modifiers}
            isFirst={index === 0}
            isLast={index === drinks.length - 1}
            onEdit={() => setEditingDrink(drink)}
            onToggleActive={() => handleToggleDrinkActive(drink)}
            onMoveUp={() => handleMoveDrink(drink.id, "up")}
            onMoveDown={() => handleMoveDrink(drink.id, "down")}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-900">Modifiers</h2>
          <button
            onClick={() => setEditingModifier("new")}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
          >
            + Add Modifier
          </button>
        </div>
        {modifiers.length === 0 && <p className="text-amber-700">No modifiers yet.</p>}
        {modifiers.map((modifier, index) => (
          <ModifierRow
            key={modifier.id}
            modifier={modifier}
            isFirst={index === 0}
            isLast={index === modifiers.length - 1}
            onEdit={() => setEditingModifier(modifier)}
            onToggleActive={() => handleToggleModifierActive(modifier)}
            onMoveUp={() => handleMoveModifier(modifier.id, "up")}
            onMoveDown={() => handleMoveModifier(modifier.id, "down")}
          />
        ))}
      </section>

      {editingDrink && (
        <DrinkFormModal
          drink={editingDrink === "new" ? null : editingDrink}
          allModifiers={modifiers}
          onSave={handleSaveDrink}
          onCancel={() => setEditingDrink(null)}
        />
      )}

      {editingModifier && (
        <ModifierFormModal
          modifier={editingModifier === "new" ? null : editingModifier}
          onSave={handleSaveModifier}
          onCancel={() => setEditingModifier(null)}
        />
      )}
    </main>
  );
}
