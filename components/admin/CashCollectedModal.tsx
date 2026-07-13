"use client";

import { Button } from "@/components/ui/Button";

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
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-lg">
        <p className="text-lg font-semibold text-amber-900">Cash collected?</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={onConfirm}>Yes</Button>
          <Button variant="secondary" onClick={onDeny}>
            No
          </Button>
          <button onClick={onCancel} className="mt-1 text-sm text-amber-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
