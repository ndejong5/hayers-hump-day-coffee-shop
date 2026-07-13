"use client";

export function CashCollectedModal({
  onConfirm,
  onDeny,
  onCancel,
}: {
  onConfirm: () => void;
  onDeny: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-lg">
        <span className="text-5xl">💵</span>
        <p className="mt-2 font-display text-xl font-bold text-amber-900">Cash collected?</p>
        <div className="mt-4 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full rounded-full bg-orange-500 py-4 text-lg font-bold text-white shadow-md shadow-orange-900/20 active:scale-[0.98]"
          >
            ✅ Yes
          </button>
          <button
            onClick={onDeny}
            className="w-full rounded-full bg-amber-100 py-4 text-lg font-bold text-amber-900 active:scale-[0.98]"
          >
            ❌ No
          </button>
          <button onClick={onCancel} className="mt-1 text-sm text-amber-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
