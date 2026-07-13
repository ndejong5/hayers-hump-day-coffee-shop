"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Modifier } from "@/lib/types";
import type { MenuDrink } from "@/lib/data";
import { uploadDrinkImage } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { DrinkIllustration } from "@/components/customer/DrinkIllustration";

export function DrinkFormModal({
  drink,
  allModifiers,
  onSave,
  onCancel,
}: {
  drink: MenuDrink | null;
  allModifiers: Modifier[];
  onSave: (input: {
    name: string;
    description: string;
    price_cents: number;
    imageUrl: string | null;
    modifierIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(drink?.name ?? "");
  const [description, setDescription] = useState(drink?.description ?? "");
  const [price, setPrice] = useState(drink ? (drink.price_cents / 100).toFixed(2) : "");
  const [modifierIds, setModifierIds] = useState<Set<string>>(new Set(drink?.modifierIds ?? []));
  const [imageUrl, setImageUrl] = useState<string | null>(drink?.image_url ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(drink?.image_url ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModifier(id: string) {
    setModifierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleRemoveImage() {
    setPendingFile(null);
    setImageUrl(null);
    setImagePreview(null);
  }

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

    let finalImageUrl = imageUrl;
    if (pendingFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", pendingFile);
      const result = await uploadDrinkImage(formData);
      setUploading(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      finalImageUrl = result.url;
    }

    setError(null);
    setSaving(true);
    await onSave({
      name: trimmedName,
      description: description.trim(),
      price_cents: cents,
      imageUrl: finalImageUrl,
      modifierIds: Array.from(modifierIds),
    });
    setSaving(false);
  }

  const busy = uploading || saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="my-8 flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg"
      >
        <h3 className="font-display text-lg font-bold text-amber-900">
          {drink ? "Edit Drink" : "Add Drink"}
        </h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">Photo</label>
          <div className="flex items-center gap-3">
            {imagePreview ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL */}
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <DrinkIllustration name={name || "drink"} className="h-20 w-20 shrink-0" />
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-full border-2 border-amber-300 px-3 py-2 text-center text-sm font-semibold text-amber-900">
                {imagePreview ? "Change Photo" : "Add Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickFile}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-red-700"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-amber-600">
            No photo? A cheerful illustration is used automatically.
          </p>
        </div>

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
          <label className="mb-1 block text-sm font-medium text-amber-900">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">Price ($)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="1.50"
            className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {allModifiers.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-amber-900">Modifiers</label>
            <div className="flex flex-col gap-1">
              {allModifiers.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    checked={modifierIds.has(m.id)}
                    onChange={() => toggleModifier(m.id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {uploading ? "Uploading photo..." : saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
