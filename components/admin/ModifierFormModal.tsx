"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Modifier } from "@/lib/types";
import { uploadModifierImage } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

export function ModifierFormModal({
  modifier,
  onSave,
  onCancel,
}: {
  modifier: Modifier | null;
  onSave: (input: {
    name: string;
    price_cents: number;
    icon: string;
    imageUrl: string | null;
    instruction: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(modifier?.name ?? "");
  const [price, setPrice] = useState(modifier ? (modifier.price_cents / 100).toFixed(2) : "0.00");
  const [icon, setIcon] = useState(modifier?.icon ?? "➕");
  const [instruction, setInstruction] = useState(modifier?.instruction ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(modifier?.image_url ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(modifier?.image_url ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await uploadModifierImage(formData);
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
      price_cents: cents,
      icon: icon.trim() || "➕",
      imageUrl: finalImageUrl,
      instruction: instruction.trim() || null,
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
          {modifier ? "Edit Modifier" : "Add Modifier"}
        </h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">
            Photo (optional)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-100 text-3xl">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                icon || "➕"
              )}
            </div>
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
          <p className="mt-1 text-xs text-amber-600">No photo? The icon below is used instead.</p>
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
          <label className="mb-1 block text-sm font-medium text-amber-900">
            Icon (emoji, shown on the student prep card)
          </label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="➕"
            className="w-24 rounded-xl border-2 border-amber-200 px-3 py-2 text-center text-2xl focus:border-amber-500 focus:outline-none"
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

        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">
            Prep instruction (optional)
          </label>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={`Add ${name.trim() || "..."}`}
            className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-amber-600">
            Leave blank to default to &quot;Add {name.trim() || "[name]"}&quot;.
          </p>
        </div>

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
