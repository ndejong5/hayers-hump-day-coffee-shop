import type { Modifier } from "@/lib/types";
import { formatCents } from "@/lib/currency";

export function ModifierRow({
  modifier,
  isFirst,
  isLast,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: {
  modifier: Modifier;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ${modifier.is_active ? "" : "opacity-50"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-semibold text-amber-900">{modifier.name}</p>
        <span className="font-semibold text-amber-900">
          {modifier.price_cents > 0 ? formatCents(modifier.price_cents) : "Free"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="rounded-lg border-2 border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900"
        >
          Edit
        </button>
        <button
          onClick={onToggleActive}
          className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${
            modifier.is_active ? "border-red-300 text-red-700" : "border-green-300 text-green-700"
          }`}
        >
          {modifier.is_active ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded-lg border-2 border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded-lg border-2 border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-30"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
