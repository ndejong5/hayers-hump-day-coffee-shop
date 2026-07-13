"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getMyOrderHistory as getMyOrderHistoryData } from "@/lib/data";
import { notifyAdmins } from "@/lib/push";
import { uploadImageToBucket } from "@/lib/imageUpload";
import type { Customer, Order, PaymentMethod, WindowStatusRow } from "@/lib/types";

export async function getCustomerByDeviceId(deviceId: string): Promise<Customer | null> {
  if (!deviceId) return null;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function registerCustomer(
  deviceId: string,
  name: string,
  room: string,
  email: string
): Promise<Customer> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_or_create_customer", {
    p_device_id: deviceId,
    p_name: name,
    p_room: room,
    p_email: email,
  });
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function updateCustomerEmail(deviceId: string, email: string): Promise<Customer> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("update_customer_email", {
    p_device_id: deviceId,
    p_email: email,
  });
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function submitOrder(input: {
  deviceId: string;
  drinkId: string;
  modifierIds: string[];
  paymentMethod: PaymentMethod;
  isRedemption: boolean;
}): Promise<{ order: Order } | { error: string }> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_device_id: input.deviceId,
    p_drink_id: input.drinkId,
    p_modifier_ids: input.modifierIds,
    p_payment_method: input.paymentMethod,
    p_is_redemption: input.isRedemption,
  });
  if (error) return { error: error.message };
  const order = data as Order;

  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("name, room")
      .eq("id", order.customer_id)
      .maybeSingle();
    await notifyAdmins({
      title: "New order!",
      body: `${customer?.name ?? "Someone"}${customer?.room ? ` (Rm ${customer.room})` : ""} — ${order.drink_name_at_order}`,
      url: "/admin/board",
    });
  } catch {
    // Push delivery is best-effort; never fail order placement over it.
  }

  return { order };
}

export async function refreshWindowStatus(): Promise<WindowStatusRow> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_window_status").single();
  if (error) throw new Error(error.message);
  return data as WindowStatusRow;
}

export async function getMyOrderHistory(deviceId: string) {
  if (!deviceId) return null;
  return getMyOrderHistoryData(deviceId);
}

export async function saveCustomerPushSubscription(
  deviceId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (customerError) throw new Error(customerError.message);
  if (!customer) throw new Error("customer_not_found");

  const { error } = await supabase.from("customer_push_subscriptions").upsert(
    {
      customer_id: customer.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

export async function removeCustomerPushSubscription(endpoint: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("customer_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function uploadMyPhoto(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  return uploadImageToBucket("customer-photos", formData);
}

export async function setMyPhoto(deviceId: string, photoUrl: string | null): Promise<void> {
  if (!deviceId) return;
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("customers")
    .update({ photo_url: photoUrl })
    .eq("device_id", deviceId);
  if (error) throw new Error(error.message);
}
