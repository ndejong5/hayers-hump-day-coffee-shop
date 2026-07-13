"use client";

import { PushToggle } from "@/components/ui/PushToggle";
import { saveCustomerPushSubscription, removeCustomerPushSubscription } from "@/app/actions";

export function CustomerPushToggle({ deviceId }: { deviceId: string }) {
  return (
    <PushToggle
      onSave={(sub) => saveCustomerPushSubscription(deviceId, sub)}
      onRemove={removeCustomerPushSubscription}
      enabledLabel="🔔 Order alerts on"
      disabledLabel="🔕 Get notified about my orders"
      className="w-full max-w-sm rounded-2xl border-2 border-amber-300 bg-white px-4 py-3 text-center text-sm font-semibold text-amber-900 disabled:opacity-40"
    />
  );
}
