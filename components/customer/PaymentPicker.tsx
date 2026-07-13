"use client";

import { useState } from "react";
import type { PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function PaymentPicker({
  onBack,
  onSubmit,
  submitting,
}: {
  onBack: () => void;
  onSubmit: (method: PaymentMethod) => void;
  submitting: boolean;
}) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <button onClick={onBack} className="self-start text-amber-700">
        ← Back
      </button>
      <h2 className="text-xl font-bold text-amber-900">How are you paying?</h2>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMethod("cash")}
          className={`rounded-2xl border-2 px-4 py-4 text-lg font-semibold transition ${
            method === "cash" ? "border-amber-600 bg-amber-100" : "border-amber-200 bg-white"
          }`}
        >
          💵 Cash at delivery
        </button>
        <button
          onClick={() => setMethod("tab")}
          className={`rounded-2xl border-2 px-4 py-4 text-lg font-semibold transition ${
            method === "tab" ? "border-amber-600 bg-amber-100" : "border-amber-200 bg-white"
          }`}
        >
          📒 Add to my tab
        </button>
      </div>

      <Button disabled={!method || submitting} onClick={() => method && onSubmit(method)}>
        {submitting ? "Placing order..." : "Place order"}
      </Button>
    </div>
  );
}
