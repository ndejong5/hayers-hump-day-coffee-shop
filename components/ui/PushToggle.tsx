"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushToggle({
  onSave,
  onRemove,
  enabledLabel = "🔔 Notifications on",
  disabledLabel = "🔕 Enable notifications",
  className = "rounded-full border-2 border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900 disabled:opacity-40",
}: {
  onSave: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => Promise<void>;
  onRemove: (endpoint: string) => Promise<void>;
  enabledLabel?: string;
  disabledLabel?: string;
  className?: string;
}) {
  const [supported] = useState(
    () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  );
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, [supported]);

  async function handleEnable() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setLoading(false);
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setLoading(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      const json = sub.toJSON();
      await onSave({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      setEnabled(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await onRemove(sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button onClick={enabled ? handleDisable : handleEnable} disabled={loading} className={className}>
      {enabled ? enabledLabel : disabledLabel}
    </button>
  );
}
