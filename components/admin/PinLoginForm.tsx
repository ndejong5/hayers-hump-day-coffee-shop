"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

export function PinLoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
        className="w-full rounded-xl border-2 border-amber-200 px-4 py-4 text-center text-2xl tracking-widest focus:border-amber-500 focus:outline-none"
      />
      {error && <p className="text-center text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={isPending || !pin}>
        {isPending ? "Checking..." : "Enter"}
      </Button>
    </form>
  );
}
