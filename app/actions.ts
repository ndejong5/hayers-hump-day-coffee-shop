"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getMyOrderHistory as getMyOrderHistoryData } from "@/lib/data";
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
  room: string
): Promise<Customer> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_or_create_customer", {
    p_device_id: deviceId,
    p_name: name,
    p_room: room,
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
  return { order: data as Order };
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
