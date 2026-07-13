import "server-only";
import webpush from "web-push";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    "mailto:admin@bower-coffee-shop.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscriptions(
  table: "admin_push_subscriptions" | "customer_push_subscriptions",
  subs: SubscriptionRow[],
  payload: PushPayload
): Promise<void> {
  if (subs.length === 0) return;
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

  ensureConfigured();
  const supabase = createAdminSupabaseClient();

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from(table).delete().eq("id", sub.id);
        }
      }
    })
  );
}

export async function notifyAdmins(payload: PushPayload): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: subs } = await supabase.from("admin_push_subscriptions").select("*");
  await sendToSubscriptions("admin_push_subscriptions", subs ?? [], payload);
}

export async function notifyCustomer(customerId: string, payload: PushPayload): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: subs } = await supabase
    .from("customer_push_subscriptions")
    .select("*")
    .eq("customer_id", customerId);
  await sendToSubscriptions("customer_push_subscriptions", subs ?? [], payload);
}

export async function notifyAllCustomers(payload: PushPayload): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: subs } = await supabase.from("customer_push_subscriptions").select("*");
  await sendToSubscriptions("customer_push_subscriptions", subs ?? [], payload);
}
