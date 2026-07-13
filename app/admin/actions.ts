"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrderForBoard } from "@/lib/data";
import type { BoardOrder, ManualWindowState } from "@/lib/types";

const ADMIN_COOKIE = "bower_admin";

export async function loginAdmin(pin: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminSupabaseClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("pin_hash")
    .eq("id", 1)
    .single();
  if (error || !settings) return { ok: false, error: "Could not verify PIN. Try again." };

  const valid = await bcrypt.compare(pin, settings.pin_hash);
  if (!valid) return { ok: false, error: "Incorrect PIN." };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, settings.pin_hash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const supabase = createAdminSupabaseClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("pin_hash")
    .eq("id", 1)
    .single();
  return !!settings && settings.pin_hash === token;
}

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Not authorized");
  }
}

export async function fetchOrderForBoard(orderId: string): Promise<BoardOrder | null> {
  await requireAdmin();
  return getOrderForBoard(orderId);
}

export async function markMade(orderId: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.rpc("mark_order_made", { p_order_id: orderId });
  if (error) throw new Error(error.message);
}

export async function markDelivered(
  orderId: string,
  cashCollected: boolean | null
): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.rpc("mark_order_delivered", {
    p_order_id: orderId,
    p_cash_collected: cashCollected,
  });
  if (error) throw new Error(error.message);
}

export async function createDrink(input: {
  name: string;
  description: string;
  price_cents: number;
}): Promise<string> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { data: maxRow } = await supabase
    .from("drinks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("drinks")
    .insert({
      name: input.name,
      description: input.description || null,
      price_cents: input.price_cents,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateDrink(
  id: string,
  input: { name: string; description: string; price_cents: number }
): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("drinks")
    .update({
      name: input.name,
      description: input.description || null,
      price_cents: input.price_cents,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setDrinkActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("drinks").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setDrinkModifiers(drinkId: string, modifierIds: string[]): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error: deleteError } = await supabase
    .from("drink_modifiers")
    .delete()
    .eq("drink_id", drinkId);
  if (deleteError) throw new Error(deleteError.message);

  if (modifierIds.length > 0) {
    const { error: insertError } = await supabase
      .from("drink_modifiers")
      .insert(modifierIds.map((modifier_id) => ({ drink_id: drinkId, modifier_id })));
    if (insertError) throw new Error(insertError.message);
  }
}

export async function moveDrink(id: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { data: drinks, error } = await supabase
    .from("drinks")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const list = drinks ?? [];
  const index = list.findIndex((d) => d.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

  const a = list[index];
  const b = list[swapIndex];
  await supabase.from("drinks").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("drinks").update({ sort_order: a.sort_order }).eq("id", b.id);
}

export async function createModifier(input: {
  name: string;
  price_cents: number;
}): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { data: maxRow } = await supabase
    .from("modifiers")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("modifiers").insert({
    name: input.name,
    price_cents: input.price_cents,
    sort_order: nextSortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function updateModifier(
  id: string,
  input: { name: string; price_cents: number }
): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("modifiers")
    .update({ name: input.name, price_cents: input.price_cents })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setModifierActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("modifiers")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveModifier(id: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { data: modifiers, error } = await supabase
    .from("modifiers")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const list = modifiers ?? [];
  const index = list.findIndex((m) => m.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

  const a = list[index];
  const b = list[swapIndex];
  await supabase.from("modifiers").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("modifiers").update({ sort_order: a.sort_order }).eq("id", b.id);
}

export async function setWindowCap(windowId: string, cap: number): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("order_windows").update({ cap }).eq("id", windowId);
  if (error) throw new Error(error.message);
}

export async function setWindowManualState(
  windowId: string,
  manualState: ManualWindowState
): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("order_windows")
    .update({ manual_state: manualState })
    .eq("id", windowId);
  if (error) throw new Error(error.message);
}

export async function settleTab(customerId: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ settled_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("payment_method", "tab")
    .is("settled_at", null);
  if (error) throw new Error(error.message);
}

export async function adjustPunchCount(customerId: string, delta: number): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("punch_count")
    .eq("id", customerId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const newCount = Math.max(0, customer.punch_count + delta);
  const { error } = await supabase
    .from("customers")
    .update({ punch_count: newCount })
    .eq("id", customerId);
  if (error) throw new Error(error.message);
}

export async function setRewardSettings(input: {
  punchesRequired: number;
  modifiersChargeOnReward: boolean;
}): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("settings")
    .update({
      reward_punches_required: input.punchesRequired,
      modifiers_charge_on_reward: input.modifiersChargeOnReward,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}
