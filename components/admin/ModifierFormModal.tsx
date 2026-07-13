"use client";

import { useState, type FormEvent } from "react";
import type { Modifier } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function ModifierFormModal({
  modifier,
  onSave,
  onCancel,
}: {
  modifier: Modifier | null;
  onSave: (input: { name: string; price_cents: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(modifier?.name ?? "");
  const [price, setPrice] = useState(modifier ? (modifier.price_cents / 100).toFixed(2) : "0.00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const cents = Math.round(parseFloat(price) * 100);
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (Number.isNaN(cents) || cents < 0) {
      setError("Enter a valid price");
      return;
    }
    setError(null);
    setSaving(true);
    await onSave({ name: trimmedName, price_cents: cents });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg"
      >
        <h3 className="font-display text-lg font-bold text-amber-900">
          {modifier ? "Edit Modifier" : "Add Modifier"}
        </h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">
            Price ($, use 0.00 for free)
          </label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
