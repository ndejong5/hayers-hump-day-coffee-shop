"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPunchRow } from "@/lib/data";
import type { PublicSettings } from "@/lib/types";
import { adjustPunchCount, setRewardSettings } from "@/app/admin/actions";

export function RewardsManager({
  customers,
  settings,
}: {
  customers: CustomerPunchRow[];
  settings: PublicSettings;
}) {
  const router = useRouter();
  const [punchesRequired, setPunchesRequired] = useState(String(settings.reward_punches_required));
  const [chargeOnReward, setChargeOnReward] = useState(settings.modifiers_charge_on_reward);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleAdjust(customerId: string, delta: number) {
    setAdjustingId(customerId);
    await adjustPunchCount(customerId, delta);
    setAdjustingId(null);
    refresh();
  }

  async function handleSaveSettings() {
    const required = parseInt(punchesRequired, 10);
    if (Number.isNaN(required) || required < 1) {
      setError("Enter a valid number of punches (1 or more)");
      return;
    }
    setError(null);
    setSavingSettings(true);
    await setRewardSettings({ punchesRequired: required, modifiersChargeOnReward: chargeOnReward });
    setSavingSettings(false);
    refresh();
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <h2 className="text-xl font-bold text-amber-900">Rewards</h2>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-amber-900">
          Punches required for a free drink
        </label>
        <input
          value={punchesRequired}
          onChange={(e) => setPunchesRequired(e.target.value)}
          inputMode="numeric"
          className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />

        <label className="mt-4 flex items-center gap-2 text-sm text-amber-900">
          <input
            type="checkbox"
            checked={chargeOnReward}
            onChange={(e) => setChargeOnReward(e.target.checked)}
          />
          Modifiers still charge on free drinks
        </label>

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="mt-4 w-full rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-40"
        >
          {savingSettings ? "Saving..." : "Save settings"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {customers.length === 0 && <p className="text-amber-700">No customers yet.</p>}
        {customers.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-amber-900">{c.name}</p>
              {c.room && <p className="text-sm text-amber-600">Rm {c.room}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAdjust(c.id, -1)}
                disabled={adjustingId === c.id || c.punch_count <= 0}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-300 text-lg font-bold text-amber-900 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-bold text-amber-900">
                {c.punch_count}
              </span>
              <button
                onClick={() => handleAdjust(c.id, 1)}
                disabled={adjustingId === c.id}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-300 text-lg font-bold text-amber-900 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
