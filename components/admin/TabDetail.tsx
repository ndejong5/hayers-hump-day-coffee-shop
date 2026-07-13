"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CustomerTabDetail } from "@/lib/data";
import type { PublicSettings } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { settleTab } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

export function TabDetail({
  detail,
  settings,
}: {
  detail: CustomerTabDetail;
  settings: PublicSettings;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [settling, setSettling] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSettle() {
    setSettling(true);
    await settleTab(detail.customer_id);
    setSettling(false);
    setConfirming(false);
    router.push("/admin/tabs");
    router.refresh();
  }

  function buildStatementText(): string {
    const lines = [
      `${settings.shop_name} — Statement`,
      `${detail.customer_name}${detail.customer_room ? ` (Rm ${detail.customer_room})` : ""}`,
      "",
      ...detail.orders.map((o) => {
        const modText =
          o.modifiers.length > 0 ? ` (${o.modifiers.map((m) => m.name).join(", ")})` : "";
        return `${new Date(o.created_at).toLocaleDateString()} — ${o.drink_name_at_order}${modText} — ${formatCents(o.total_cents)}`;
      }),
      "",
      `Total due: ${formatCents(detail.balance_cents)}`,
    ];
    if (settings.venmo_link) lines.push(`Venmo: ${settings.venmo_link}`);
    if (settings.paypal_link) lines.push(`PayPal: ${settings.paypal_link}`);
    return lines.join("\n");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildStatementText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6 print:max-w-none print:px-0">
      <div className="print:hidden">
        <Link href="/admin/tabs" className="text-sm text-amber-700 underline">
          ← All tabs
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-amber-900">{settings.shop_name}</h2>
        <p className="text-amber-700">
          Statement for {detail.customer_name}
          {detail.customer_room && ` — Rm ${detail.customer_room}`}
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm print:shadow-none">
        {detail.orders.length === 0 && (
          <p className="p-4 text-amber-700">No unsettled orders.</p>
        )}
        {detail.orders.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between border-b border-amber-100 p-4 last:border-b-0"
          >
            <div>
              <p className="font-medium text-amber-900">{o.drink_name_at_order}</p>
              {o.modifiers.length > 0 && (
                <p className="text-sm text-amber-600">
                  {o.modifiers.map((m) => m.name).join(", ")}
                </p>
              )}
              <p className="text-xs text-amber-500">
                {new Date(o.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className="font-semibold text-amber-900">{formatCents(o.total_cents)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-b-2xl bg-amber-50 p-4">
          <span className="font-semibold text-amber-900">Total due</span>
          <span className="text-lg font-bold text-amber-900">
            {formatCents(detail.balance_cents)}
          </span>
        </div>
      </div>

      {(settings.venmo_link || settings.paypal_link) && (
        <div className="text-sm text-amber-700">
          {settings.venmo_link && <p>Venmo: {settings.venmo_link}</p>}
          {settings.paypal_link && <p>PayPal: {settings.paypal_link}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl border-2 border-amber-300 px-4 py-3 font-semibold text-amber-900"
          >
            Print
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 rounded-xl border-2 border-amber-300 px-4 py-3 font-semibold text-amber-900"
          >
            {copied ? "Copied!" : "Copy summary"}
          </button>
        </div>

        {detail.orders.length > 0 && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-xl border-2 border-red-300 px-4 py-3 font-semibold text-red-700"
          >
            Mark Settled
          </button>
        )}

        {confirming && (
          <div className="rounded-xl bg-red-50 p-4 text-center">
            <p className="mb-3 text-sm text-red-800">
              Mark all {detail.orders.length} order(s) as settled? This resets the balance to $0.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSettle} disabled={settling}>
                {settling ? "Settling..." : "Yes, settle"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={settling}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
