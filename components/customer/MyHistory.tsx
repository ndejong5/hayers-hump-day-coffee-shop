"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateDeviceId } from "@/lib/device";
import { getMyOrderHistory, updateCustomerEmail } from "@/app/actions";
import { formatCents } from "@/lib/currency";
import type { MyOrderLine } from "@/lib/types";
import { PunchCard } from "./PunchCard";
import { CustomerPushToggle } from "./CustomerPushToggle";
import { Button } from "@/components/ui/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoadState = "loading" | "no-customer" | "ready";

export function MyHistory() {
  const [state, setState] = useState<LoadState>("loading");
  const [deviceId, setDeviceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<MyOrderLine[]>([]);
  const [tabBalanceCents, setTabBalanceCents] = useState(0);
  const [punchCount, setPunchCount] = useState(0);
  const [rewardPunchesRequired, setRewardPunchesRequired] = useState(10);

  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    getMyOrderHistory(id).then((result) => {
      setDeviceId(id);
      if (!result) {
        setState("no-customer");
        return;
      }
      setCustomerName(result.customerName);
      setCustomerEmail(result.customerEmail);
      setOrders(result.orders);
      setTabBalanceCents(result.tabBalanceCents);
      setPunchCount(result.punchCount);
      setRewardPunchesRequired(result.rewardPunchesRequired);
      setState("ready");
    });
  }, []);

  async function handleSaveEmail() {
    const trimmed = emailInput.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError(null);
    setSavingEmail(true);
    const updated = await updateCustomerEmail(deviceId, trimmed);
    setCustomerEmail(updated.email);
    setSavingEmail(false);
    setEditingEmail(false);
  }

  if (state === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-amber-50">
        <p className="text-amber-700">Loading...</p>
      </main>
    );
  }

  if (state === "no-customer") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-amber-50 p-6 text-center">
        <p className="text-amber-800">
          We don&apos;t recognize this device yet. Place an order first!
        </p>
        <Link href="/" className="text-amber-700 underline">
          ← Back to menu
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-amber-50 px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-900">☕ My Orders</h1>
      <p className="text-amber-800">Hi {customerName}!</p>

      <div className="w-full max-w-sm rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-sm text-amber-600">Current tab balance</p>
        <p className="text-2xl font-bold text-amber-900">{formatCents(tabBalanceCents)}</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-amber-600">Email</p>
        {!editingEmail && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-amber-900">{customerEmail ?? "Not set"}</p>
            <button
              onClick={() => {
                setEmailInput(customerEmail ?? "");
                setEditingEmail(true);
              }}
              className="text-sm text-amber-600 underline"
            >
              {customerEmail ? "Edit" : "Add"}
            </button>
          </div>
        )}
        {editingEmail && (
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. sam@school.edu"
              className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            {emailError && <p className="text-sm text-red-700">{emailError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSaveEmail} disabled={savingEmail}>
                {savingEmail ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingEmail(false);
                  setEmailError(null);
                }}
                disabled={savingEmail}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <PunchCard punches={punchCount} required={rewardPunchesRequired} />

      <CustomerPushToggle deviceId={deviceId} />

      <div className="flex w-full max-w-sm flex-col gap-3">
        {orders.length === 0 && (
          <p className="text-center text-amber-700">No orders yet.</p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-amber-900">
                  {o.drink_name_at_order}
                  {o.is_reward_redemption && <span className="ml-2 text-sm">🎁 Free</span>}
                </p>
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
            <p className="mt-2 text-xs text-amber-500">
              {o.delivered_at
                ? "Delivered"
                : o.made_at
                  ? "Made — awaiting delivery"
                  : "Order placed"}
              {o.payment_method === "tab" && (o.settled_at ? " · Settled" : " · On tab")}
            </p>
          </div>
        ))}
      </div>

      <Link href="/" className="text-sm text-amber-600 underline">
        ← Back to menu
      </Link>
    </main>
  );
}
