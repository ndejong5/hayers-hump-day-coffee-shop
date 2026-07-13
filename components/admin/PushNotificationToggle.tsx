"use client";

import { PushToggle } from "@/components/ui/PushToggle";
import { saveAdminPushSubscription, removeAdminPushSubscription } from "@/app/admin/actions";

export function PushNotificationToggle() {
  return <PushToggle onSave={saveAdminPushSubscription} onRemove={removeAdminPushSubscription} />;
}
