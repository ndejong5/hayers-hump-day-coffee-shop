"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/admin/actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function PinLoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleKey(key: (typeof KEYS)[number]) {
    setError(null);
    if (key === "clear") {
      setPin("");
    } else if (key === "back") {
      setPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p + key);
    }
  }

  function handleSubmit() {
    if (!pin || isPending) return;
    startTransition(async () => {
      const result = await loginAdmin(pin);
      if (!result.ok) {
        setError(result.error);
        setPin("");
        return;
      }
      router.push("/admin/board");
      router.refresh();
    });
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-5">
      <div className="flex min-h-[2.5rem] flex-wrap items-center justify-center gap-2">
        {pin.length === 0 && <span className="text-amber-400">Enter PIN</span>}
        {Array.from(pin).map((_, i) => (
          <span key={i} className="h-5 w-5 rounded-full bg-orange-500 shadow-sm" />
        ))}
      </div>

      {error && <p className="text-center text-sm font-medium text-red-700">{error}</p>}

      <div className="grid w-full grid-cols-3 gap-3">
        {KEYS.map((key) => {
          if (key === "clear") {
            return (
              <button
                key={key}
                onClick={() => handleKey("clear")}
                disabled={isPending}
                className="aspect-square rounded-full bg-amber-100 text-sm font-bold text-amber-700 active:scale-95 disabled:opacity-40"
              >
                Clear
              </button>
            );
          }
          if (key === "back") {
            return (
              <button
                key={key}
                onClick={() => handleKey("back")}
                disabled={isPending}
                className="aspect-square rounded-full bg-amber-100 text-2xl font-bold text-amber-700 active:scale-95 disabled:opacity-40"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => handleKey(key)}
              disabled={isPending}
              className="aspect-square rounded-full bg-white font-display text-3xl font-bold text-amber-900 shadow-sm active:scale-95 disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || !pin}
        className="w-full rounded-full bg-orange-500 py-4 text-lg font-bold text-white shadow-md shadow-orange-900/20 transition disabled:opacity-40"
      >
        {isPending ? "Checking..." : "Enter ☕"}
      </button>
    </div>
  );
}
