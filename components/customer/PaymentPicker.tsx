"use client";

import { useMemo, useState } from "react";
import type { PaymentMethod } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { Button } from "@/components/ui/Button";

const NOTE_MAX_LENGTH = 140;

export function PaymentPicker({
  subtotalCents,
  onBack,
  onSubmit,
  submitting,
}: {
  subtotalCents: number;
  onBack: () => void;
  onSubmit: (method: PaymentMethod, tipCents: number, note: string) => void;
  submitting: boolean;
}) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [tipCents, setTipCents] = useState(0);
  const [note, setNote] = useState("");

  const roundUpCents = useMemo(() => {
    const remainder = subtotalCents % 100;
    return remainder === 0 ? 0 : 100 - remainder;
  }, [subtotalCents]);

  const tipOptions = useMemo(() => {
    const options: { label: string; cents: number }[] = [{ label: "No tip", cents: 0 }];
    if (roundUpCents > 0) {
      options.push({ label: `Round up (+${formatCents(roundUpCents)})`, cents: roundUpCents });
    }
    options.push({ label: "+$1", cents: 100 });
    options.push({ label: "+$2", cents: 200 });
    return options;
  }, [roundUpCents]);

  const grandTotal = subtotalCents + tipCents;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <button onClick={onBack} className="self-start font-medium text-orange-600">
        ← Back
      </button>
      <h2 className="font-display text-2xl font-bold text-amber-900">How are you paying?</h2>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMethod("cash")}
          className={`rounded-2xl border-2 px-4 py-4 text-lg font-semibold transition ${
            method === "cash" ? "border-orange-500 bg-orange-100" : "border-amber-200 bg-white"
          }`}
        >
          💵 Cash at delivery
        </button>
        <button
          onClick={() => setMethod("tab")}
          className={`rounded-2xl border-2 px-4 py-4 text-lg font-semibold transition ${
            method === "tab" ? "border-orange-500 bg-orange-100" : "border-amber-200 bg-white"
          }`}
        >
          📒 Add to my tab
        </button>
      </div>

      <div>
        <p className="mb-2 font-medium text-amber-900">Add a tip for the crew? 💛</p>
        <div className="grid grid-cols-2 gap-2">
          {tipOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => setTipCents(option.cents)}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition ${
                tipCents === option.cents
                  ? "border-orange-500 bg-orange-100 text-orange-900"
                  : "border-amber-200 bg-white text-amber-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-amber-900">
          Note to the crew <span className="font-normal text-amber-500">(optional)</span>
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
          placeholder="e.g. extra napkins please!"
          className="w-full rounded-2xl border-2 border-amber-200 px-4 py-3 focus:border-orange-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <span className="font-medium text-amber-900">Total due</span>
        <span className="text-lg font-bold text-amber-900">{formatCents(grandTotal)}</span>
      </div>

      <Button
        disabled={!method || submitting}
        onClick={() => method && onSubmit(method, tipCents, note.trim())}
      >
        {submitting ? "Placing order..." : "Place order"}
      </Button>
    </div>
  );
}
