"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateDeviceId } from "@/lib/device";
import {
  getCustomerByDeviceId,
  registerCustomer,
  submitOrder,
  refreshWindowStatus,
  getMyUsualOrder,
  reorderUsual,
  type UsualOrder,
} from "@/app/actions";
import type { Customer, Order, PaymentMethod, PublicSettings, WindowStatusRow, Modifier } from "@/lib/types";
import type { MenuDrink } from "@/lib/data";
import { formatCents } from "@/lib/currency";
import { StatusBanner } from "./StatusBanner";
import { NameEntryForm } from "./NameEntryForm";
import { DrinkGrid } from "./DrinkGrid";
import { ModifierPicker } from "./ModifierPicker";
import { PaymentPicker } from "./PaymentPicker";
import { OrderConfirmation } from "./OrderConfirmation";

type Step = "loading" | "name" | "menu" | "modifiers" | "payment" | "confirm";

export function OrderFlow({
  drinks,
  modifiers,
  windowStatus: initialWindowStatus,
  settings,
}: {
  drinks: MenuDrink[];
  modifiers: Modifier[];
  windowStatus: WindowStatusRow;
  settings: PublicSettings;
}) {
  const [step, setStep] = useState<Step>("loading");
  const [deviceId, setDeviceId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [usual, setUsual] = useState<UsualOrder | null>(null);
  const [windowStatus, setWindowStatus] = useState(initialWindowStatus);
  const [selectedDrink, setSelectedDrink] = useState<MenuDrink | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [selectedSubtotalCents, setSelectedSubtotalCents] = useState(0);
  const [isRedemption, setIsRedemption] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    getCustomerByDeviceId(id).then((c) => {
      setDeviceId(id);
      setCustomer(c);
      setStep(c ? "menu" : "name");
      if (c) getMyUsualOrder(id).then(setUsual);
    });
  }, []);

  async function handleNameSubmit(name: string, room: string, email: string) {
    const c = await registerCustomer(deviceId, name, room, email);
    setCustomer(c);
    setStep("menu");
  }

  function handleSelectDrink(drink: MenuDrink) {
    setSelectedDrink(drink);
    setOrderError(null);
    setStep("modifiers");
  }

  function handleModifiersContinue(modifierIds: string[], redeem: boolean, totalCents: number) {
    setSelectedModifierIds(modifierIds);
    setIsRedemption(redeem);
    setSelectedSubtotalCents(totalCents);
    setStep("payment");
  }

  async function afterOrderResult(result: { order: Order } | { error: string }) {
    setSubmitting(false);

    const fresh = await refreshWindowStatus();
    setWindowStatus(fresh);

    if ("error" in result) {
      setOrderError(friendlyError(result.error));
      setStep("menu");
      return;
    }

    const [freshCustomer, freshUsual] = await Promise.all([
      getCustomerByDeviceId(deviceId),
      getMyUsualOrder(deviceId),
    ]);
    setCustomer(freshCustomer);
    setUsual(freshUsual);

    setLastOrder(result.order);
    setStep("confirm");
  }

  async function handlePaymentSubmit(method: PaymentMethod, tipCents: number, note: string) {
    if (!selectedDrink) return;
    setSubmitting(true);
    setOrderError(null);
    const result = await submitOrder({
      deviceId,
      drinkId: selectedDrink.id,
      modifierIds: selectedModifierIds,
      paymentMethod: method,
      isRedemption,
      tipCents,
      note: note || null,
    });
    await afterOrderResult(result);
  }

  async function handleReorderUsual() {
    setSubmitting(true);
    setOrderError(null);
    const result = await reorderUsual(deviceId);
    await afterOrderResult(result);
  }

  function handleOrderAgain() {
    setSelectedDrink(null);
    setSelectedModifierIds([]);
    setIsRedemption(false);
    setLastOrder(null);
    setStep("menu");
  }

  if (step === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-amber-700">Loading...</p>
      </main>
    );
  }

  const eligibleForReward = !!customer && customer.punch_count >= settings.reward_punches_required;
  const canOrder = windowStatus.status === "open";

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <div className="w-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-700 px-6 pb-8 pt-10 text-center shadow-md">
        <p className="font-display text-3xl font-extrabold text-white drop-shadow-sm">
          ☕ {settings.shop_name}
        </p>
        <p className="mt-1 text-sm font-medium text-orange-50">
          Fresh drinks, delivered every Wednesday
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-6 px-4 py-6">
        {step !== "name" && <StatusBanner status={windowStatus} />}

        {orderError && (
          <div className="w-full max-w-sm rounded-2xl bg-red-100 px-4 py-3 text-center text-red-800">
            {orderError}
          </div>
        )}

        {step === "name" && <NameEntryForm onSubmit={handleNameSubmit} />}

        {step === "menu" && customer && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="text-center">
              <p className="font-display text-xl font-bold text-amber-900">
                Hi {customer.name}! 👋
              </p>
              <p className="mt-1 text-sm text-amber-600">
                {eligibleForReward
                  ? "🎉 You have a free drink ready!"
                  : `${customer.punch_count} / ${settings.reward_punches_required} punches toward a free drink`}
              </p>
            </div>

            {usual && (
              <button
                onClick={handleReorderUsual}
                disabled={!canOrder || submitting}
                className="w-full rounded-3xl bg-gradient-to-r from-orange-400 to-amber-600 p-4 text-left text-white shadow-md transition active:scale-[0.98] disabled:opacity-40"
              >
                <p className="font-display text-lg font-bold">🔁 Reorder my usual</p>
                <p className="text-sm text-orange-50">
                  {usual.drinkName}
                  {usual.modifierNames.length > 0 && ` (${usual.modifierNames.join(", ")})`} —{" "}
                  {formatCents(usual.totalCents)}
                </p>
              </button>
            )}

            <DrinkGrid drinks={drinks} disabled={!canOrder} onSelect={handleSelectDrink} />
          </div>
        )}

        {step === "modifiers" && selectedDrink && (
          <ModifierPicker
            drink={selectedDrink}
            modifiers={modifiers}
            eligibleForReward={eligibleForReward}
            modifiersChargeOnReward={settings.modifiers_charge_on_reward}
            onBack={() => setStep("menu")}
            onContinue={handleModifiersContinue}
          />
        )}

        {step === "payment" && (
          <PaymentPicker
            subtotalCents={selectedSubtotalCents}
            onBack={() => setStep("modifiers")}
            onSubmit={handlePaymentSubmit}
            submitting={submitting}
          />
        )}

        {step === "confirm" && lastOrder && (
          <OrderConfirmation
            order={lastOrder}
            settings={settings}
            canOrderAgain={windowStatus.status === "open"}
            onOrderAgain={handleOrderAgain}
          />
        )}

        <div className="mt-auto flex flex-col items-center gap-2 pt-6">
          <Link href="/me" className="text-sm font-medium text-orange-600 underline">
            📋 My orders &amp; tab
          </Link>
          <Link href="/admin/login" className="text-sm font-medium text-orange-600 underline">
            👩‍🍳 Barista login
          </Link>
        </div>
      </div>
    </main>
  );
}

function friendlyError(message: string): string {
  if (message.includes("cap_reached")) return "Sorry, we just reached this week's order limit!";
  if (message.includes("window_closed")) return "Ordering just closed. Check back next Monday!";
  if (message.includes("not_enough_punches"))
    return "You don't have enough punches for a free drink yet.";
  return "Something went wrong placing your order. Please try again.";
}
