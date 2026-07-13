"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ManualWindowState, WindowStatus, WindowStatusRow } from "@/lib/types";
import { setWindowCap, setWindowManualState } from "@/app/admin/actions";

const STATE_LABELS: Record<ManualWindowState, { title: string; hint: string }> = {
  auto: { title: "Auto", hint: "Open automatically until the cap is reached" },
  forced_open: { title: "Force Open", hint: "Stay open regardless of schedule (cap still applies)" },
  forced_closed: { title: "Force Closed", hint: "Block all new orders regardless of cap" },
};

const STATUS_LABELS: Record<WindowStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-green-100 text-green-900" },
  closed_cap: { label: "Closed — cap reached", className: "bg-red-100 text-red-900" },
  closed_admin: { label: "Closed — by admin", className: "bg-red-100 text-red-900" },
};

export function WindowManager({ windowStatus }: { windowStatus: WindowStatusRow }) {
  const router = useRouter();
  const [capInput, setCapInput] = useState(String(windowStatus.cap));
  const [savingCap, setSavingCap] = useState(false);
  const [savingState, setSavingState] = useState<ManualWindowState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleSaveCap() {
    const cap = parseInt(capInput, 10);
    if (Number.isNaN(cap) || cap < 0) {
      setError("Enter a valid cap (0 or higher)");
      return;
    }
    setError(null);
    setSavingCap(true);
    await setWindowCap(windowStatus.id, cap);
    setSavingCap(false);
    refresh();
  }

  async function handleSetState(state: ManualWindowState) {
    setSavingState(state);
    await setWindowManualState(windowStatus.id, state);
    setSavingState(null);
    refresh();
  }

  const statusInfo = STATUS_LABELS[windowStatus.status];
  const weekLabel = new Date(`${windowStatus.week_start}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <h2 className="text-xl font-bold text-amber-900">Order Window</h2>

      <div className={`rounded-2xl px-4 py-4 text-center ${statusInfo.className}`}>
        <p className="text-lg font-semibold">{statusInfo.label}</p>
        <p className="text-sm">
          {windowStatus.order_count} of {windowStatus.cap} slots used ·{" "}
          {windowStatus.slots_remaining} remaining
        </p>
        <p className="mt-1 text-xs opacity-75">Week of {weekLabel}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-amber-900">Weekly cap</label>
        <div className="flex gap-2">
          <input
            value={capInput}
            onChange={(e) => setCapInput(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleSaveCap}
            disabled={savingCap}
            className="shrink-0 rounded-xl bg-amber-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-40"
          >
            {savingCap ? "Saving..." : "Update"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-amber-900">Manual override</label>
        <div className="flex flex-col gap-2">
          {(Object.keys(STATE_LABELS) as ManualWindowState[]).map((state) => (
            <button
              key={state}
              onClick={() => handleSetState(state)}
              disabled={savingState !== null}
              className={`rounded-xl border-2 px-4 py-3 text-left transition disabled:opacity-60 ${
                windowStatus.manual_state === state
                  ? "border-amber-600 bg-amber-100"
                  : "border-amber-200 bg-white"
              }`}
            >
              <span className="font-semibold text-amber-900">{STATE_LABELS[state].title}</span>
              <span className="block text-xs font-normal text-amber-600">
                {STATE_LABELS[state].hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
