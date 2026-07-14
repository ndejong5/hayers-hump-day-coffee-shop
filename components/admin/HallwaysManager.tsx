"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Hallway } from "@/lib/types";
import {
  createHallway,
  renameHallway,
  deleteHallway,
  moveHallway,
  addRangeRule,
  addExactRule,
  removeHallwayRule,
} from "@/app/admin/actions";

export function HallwaysManager({ hallways }: { hallways: Hallway[] }) {
  const router = useRouter();
  const [newHallwayName, setNewHallwayName] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function handleAddHallway() {
    const name = newHallwayName.trim();
    if (!name) return;
    setBusy(true);
    await createHallway(name);
    setNewHallwayName("");
    setBusy(false);
    refresh();
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <h2 className="font-display text-xl font-bold text-amber-900">Hallways</h2>
      <p className="text-sm text-amber-700">
        Group rooms into hallways for the delivery run sheet, in walking order. Rooms that
        don&apos;t match any rule show up as &quot;Unassigned&quot; on the run sheet, where you
        can assign them on the spot.
      </p>

      <div className="flex gap-2">
        <input
          value={newHallwayName}
          onChange={(e) => setNewHallwayName(e.target.value)}
          placeholder="e.g. A Hall"
          className="w-full rounded-xl border-2 border-amber-200 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />
        <button
          onClick={handleAddHallway}
          disabled={busy || !newHallwayName.trim()}
          className="shrink-0 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          + Add
        </button>
      </div>

      {hallways.length === 0 && <p className="text-amber-700">No hallways yet — add one above.</p>}

      <div className="flex flex-col gap-3">
        {hallways.map((hallway, index) => (
          <HallwayCard
            key={hallway.id}
            hallway={hallway}
            isFirst={index === 0}
            isLast={index === hallways.length - 1}
            onRename={async (name) => {
              await renameHallway(hallway.id, name);
              refresh();
            }}
            onDelete={async () => {
              await deleteHallway(hallway.id);
              refresh();
            }}
            onMoveUp={async () => {
              await moveHallway(hallway.id, "up");
              refresh();
            }}
            onMoveDown={async () => {
              await moveHallway(hallway.id, "down");
              refresh();
            }}
            onRefresh={refresh}
          />
        ))}
      </div>
    </main>
  );
}

function HallwayCard({
  hallway,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRefresh,
}: {
  hallway: Hallway;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRefresh: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(hallway.name);
  const [rangeMin, setRangeMin] = useState("");
  const [rangeMax, setRangeMax] = useState("");
  const [exactValue, setExactValue] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSaveName() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== hallway.name) onRename(trimmed);
    setEditingName(false);
  }

  async function handleAddRange() {
    const min = parseInt(rangeMin, 10);
    const max = parseInt(rangeMax, 10);
    if (Number.isNaN(min) || Number.isNaN(max)) return;
    setBusy(true);
    await addRangeRule(hallway.id, Math.min(min, max), Math.max(min, max));
    setRangeMin("");
    setRangeMax("");
    setBusy(false);
    onRefresh();
  }

  async function handleAddExact() {
    const value = exactValue.trim();
    if (!value) return;
    setBusy(true);
    await addExactRule(hallway.id, value);
    setExactValue("");
    setBusy(false);
    onRefresh();
  }

  async function handleRemoveRule(ruleId: string) {
    setBusy(true);
    await removeHallwayRule(ruleId);
    setBusy(false);
    onRefresh();
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {editingName ? (
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            autoFocus
            className="w-full rounded-lg border-2 border-amber-300 px-2 py-1 font-display text-lg font-bold text-amber-900 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="font-display text-lg font-bold text-amber-900"
          >
            {hallway.name}
          </button>
        )}
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 text-sm font-bold text-amber-900 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 text-sm font-bold text-amber-900 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-300 text-sm font-bold text-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      {hallway.rules.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hallway.rules.map((rule) => (
            <span
              key={rule.id}
              className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
            >
              {rule.kind === "range"
                ? `Rooms ${rule.range_min}–${rule.range_max}`
                : rule.exact_value}
              <button
                onClick={() => handleRemoveRule(rule.id)}
                disabled={busy}
                className="ml-1 text-amber-500"
                aria-label="Remove rule"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-amber-100 pt-3">
        <div className="flex items-center gap-2">
          <input
            value={rangeMin}
            onChange={(e) => setRangeMin(e.target.value)}
            placeholder="100"
            inputMode="numeric"
            className="w-20 rounded-lg border-2 border-amber-200 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
          <span className="text-sm text-amber-600">–</span>
          <input
            value={rangeMax}
            onChange={(e) => setRangeMax(e.target.value)}
            placeholder="120"
            inputMode="numeric"
            className="w-20 rounded-lg border-2 border-amber-200 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleAddRange}
            disabled={busy || !rangeMin || !rangeMax}
            className="rounded-full border-2 border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-900 disabled:opacity-40"
          >
            + Room range
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={exactValue}
            onChange={(e) => setExactValue(e.target.value)}
            placeholder="e.g. Gym"
            className="w-full rounded-lg border-2 border-amber-200 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleAddExact}
            disabled={busy || !exactValue.trim()}
            className="shrink-0 rounded-full border-2 border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-900 disabled:opacity-40"
          >
            + Exact
          </button>
        </div>
      </div>
    </div>
  );
}
