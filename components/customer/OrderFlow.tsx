"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateDeviceId } from "@/lib/device";
import {
  getCustomerByDeviceId,
  registerCustomer,
  submitOrder,
  refreshWindowStatus,
} from "@/app/actions";
import type { Customer, Order, PaymentMethod, PublicSettings, WindowStatusRow, Modifier } from "@/lib/types";
import type { MenuDrink } from "@/lib/data";
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
  const [windowStatus, setWindowStatus] = useState(initialWindowStatus);
  const [selectedDrink, setSelectedDrink] = useState<MenuDrink | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
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
    });
  }, []);

  async function handleNameSubmit(name: string, room: string) {
    const c = await registerCustomer(deviceId, name, room);
    setCustomer(c);
    setStep("menu");
  }

  function handleSelectDrink(drink: MenuDrink) {
    setSelectedDrink(drink);
    setOrderError(null);
    setStep("modifiers");
  }

  function handleModifiersContinue(modifierIds: string[], redeem: boolean) {
    setSelectedModifierIds(modifierIds);
    setIsRedemption(redeem);
    setStep("payment");
  }

  async function handlePaymentSubmit(method: PaymentMethod) {
    if (!selectedDrink) return;
    setSubmitting(true);
    setOrderError(null);
    const result = await submitOrder({
      deviceId,
      drinkId: selectedDrink.id,
      modifierIds: selectedModifierIds,
      paymentMethod: method,
      isRedemption,
    });
    setSubmitting(false);

    const fresh = await refreshWindowStatus();
    setWindowStatus(fresh);

    if ("error" in result) {
      setOrderError(friendlyError(result.error));
      setStep("menu");
      return;
    }

    const freshCustomer = await getCustomerByDeviceId(deviceId);
    setCustomer(freshCustomer);

    setLastOrder(result.order);
    setStep("confirm");
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
      <main className="flex min-h-dvh items-center justify-center bg-amber-50">
        <p className="text-amber-700">Loading...</p>
      </main>
    );
  }

  const eligibleForReward = !!customer && customer.punch_count >= settings.reward_punches_required;

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-amber-50 px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-900">☕ {settings.shop_name}</h1>

      {step !== "name" && <StatusBanner status={windowStatus} />}

      {orderError && (
        <div className="w-full max-w-sm rounded-xl bg-red-100 px-4 py-3 text-center text-red-800">
          {orderError}
        </div>
      )}

      {step === "name" && <NameEntryForm onSubmit={handleNameSubmit} />}

      {step === "menu" && customer && (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="text-center">
            <p className="text-amber-800">Hi {customer.name}! What are you in the mood for?</p>
            <p className="mt-1 text-sm text-amber-600">
              {eligibleForReward
                ? "🎉 You have a free drink ready!"
                : `${customer.punch_count} / ${settings.reward_punches_required} punches toward a free drink`}
            </p>
          </div>
          <DrinkGrid
            drinks={drinks}
            disabled={windowStatus.status !== "open"}
            onSelect={handleSelectDrink}
          />
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
          onBack={() => setStep("modifiers")}
          onSubmit={handlePaymentSubmit}
          submitting={submitting}
        />
      )}

      {step === "confirm" && lastOrder && (
        <OrderConfirmation
          order={lastOrder}
          canOrderAgain={windowStatus.status === "open"}
          onOrderAgain={handleOrderAgain}
        />
      )}

      <div className="mt-auto flex flex-col items-center gap-2 pt-6">
        <Link href="/me" className="text-sm text-amber-600 underline">
          📋 My orders &amp; tab
        </Link>
        <Link href="/admin/login" className="text-sm text-amber-600 underline">
          👩‍🍳 Barista login
        </Link>
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
