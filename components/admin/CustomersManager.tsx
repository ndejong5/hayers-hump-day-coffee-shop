"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPhotoRow } from "@/lib/data";
import { uploadCustomerPhoto, setCustomerPhoto } from "@/app/admin/actions";
import { CustomerAvatar } from "./CustomerAvatar";

export function CustomersManager({ customers }: { customers: CustomerPhotoRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePickFile(customerId: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setBusyId(customerId);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCustomerPhoto(formData);
    if ("error" in result) {
      setBusyId(null);
      setError(result.error);
      return;
    }
    await setCustomerPhoto(customerId, result.url);
    setBusyId(null);
    router.refresh();
  }

  async function handleRemove(customerId: string) {
    setBusyId(customerId);
    await setCustomerPhoto(customerId, null);
    setBusyId(null);
    router.refresh();
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <h2 className="font-display text-xl font-bold text-amber-900">Customers</h2>
      <p className="text-sm text-amber-700">
        Add a photo per customer so drink labels can show a picture to match
        along with the name.
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {customers.length === 0 && <p className="text-amber-700">No customers yet.</p>}

      <div className="flex flex-col gap-3">
        {customers.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <CustomerAvatar
              name={c.name}
              photoUrl={c.photo_url}
              className="h-16 w-16 shrink-0"
              textClassName="text-xl"
            />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">{c.name}</p>
              {c.room && <p className="text-sm text-amber-600">Rm {c.room}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="cursor-pointer whitespace-nowrap rounded-full border-2 border-amber-300 px-3 py-2 text-center text-sm font-semibold text-amber-900">
                {busyId === c.id ? "Uploading..." : c.photo_url ? "Change" : "Add Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busyId === c.id}
                  onChange={(e) => handlePickFile(c.id, e)}
                />
              </label>
              {c.photo_url && (
                <button
                  onClick={() => handleRemove(c.id)}
                  disabled={busyId === c.id}
                  className="text-xs text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
