"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicSettings } from "@/lib/types";
import { setPaymentLinks } from "@/app/admin/actions";

export function PaymentLinksManager({ settings }: { settings: PublicSettings }) {
  const router = useRouter();
  const [venmoLink, setVenmoLink] = useState(settings.venmo_link ?? "");
  const [paypalLink, setPaypalLink] = useState(settings.paypal_link ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await setPaymentLinks({ venmoLink: venmoLink.trim(), paypalLink: paypalLink.trim() });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <h2 className="font-display text-xl font-bold text-amber-900">Payment Links</h2>
      <p className="text-sm text-amber-700">
        Optional. If set, customers see a &quot;Pay with Venmo/PayPal&quot; button on order
        confirmations and monthly statements, pre-filled with the amount owed.
      </p>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-amber-900">Venmo link</label>
        <input
          value={venmoLink}
          onChange={(e) => setVenmoLink(e.target.value)}
          placeholder="https://venmo.com/u/YourUsername"
          className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />

        <label className="mb-2 mt-4 block text-sm font-medium text-amber-900">
          PayPal.Me link
        </label>
        <input
          value={paypalLink}
          onChange={(e) => setPaypalLink(e.target.value)}
          placeholder="https://paypal.me/YourUsername"
          className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
    </main>
  );
}
