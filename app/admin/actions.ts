"use server";

import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrderForBoard, getCustomerTabDetail, getPublicSettings } from "@/lib/data";
import { buildVenmoLink, buildPaypalLink } from "@/lib/paymentLinks";
import { formatCents } from "@/lib/currency";
import { notifyCustomer } from "@/lib/push";
import { uploadImageToBucket } from "@/lib/imageUpload";
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
  const { data, error } = await supabase.rpc("mark_order_delivered", {
    p_order_id: orderId,
    p_cash_collected: cashCollected,
  });
  if (error) throw new Error(error.message);

  const order = data as { customer_id: string; drink_name_at_order: string } | null;
  if (order) {
    try {
      await notifyCustomer(order.customer_id, {
        title: "Your coffee has arrived! ☕",
        body: `Your ${order.drink_name_at_order} was just delivered.`,
        url: "/me",
      });
    } catch {
      // Push delivery is best-effort; never fail the delivery update over it.
    }
  }
}

export async function createDrink(input: {
  name: string;
  description: string;
  price_cents: number;
  imageUrl: string | null;
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
      image_url: input.imageUrl,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateDrink(
  id: string,
  input: { name: string; description: string; price_cents: number; imageUrl: string | null }
): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("drinks")
    .update({
      name: input.name,
      description: input.description || null,
      price_cents: input.price_cents,
      image_url: input.imageUrl,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function uploadDrinkImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  await requireAdmin();
  return uploadImageToBucket("drink-images", formData);
}

export async function uploadCustomerPhoto(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  await requireAdmin();
  return uploadImageToBucket("customer-photos", formData);
}

export async function setCustomerPhoto(customerId: string, photoUrl: string | null): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("customers")
    .update({ photo_url: photoUrl })
    .eq("id", customerId);
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

export async function setPaymentLinks(input: {
  venmoLink: string;
  paypalLink: string;
}): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("settings")
    .update({
      venmo_link: input.venmoLink || null,
      paypal_link: input.paypalLink || null,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export async function sendBillEmail(
  customerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const [detail, settings] = await Promise.all([
    getCustomerTabDetail(customerId),
    getPublicSettings(),
  ]);
  if (!detail) return { ok: false, error: "Customer not found." };
  if (!detail.customer_email) return { ok: false, error: "This customer has no email on file." };
  if (detail.orders.length === 0) return { ok: false, error: "No unsettled orders to bill." };

  const note = `${settings.shop_name} - ${detail.customer_name}`;
  const venmoLink = buildVenmoLink(settings.venmo_link ?? "", detail.balance_cents, note);
  const paypalLink = buildPaypalLink(settings.paypal_link ?? "", detail.balance_cents);

  const rows = detail.orders
    .map((o) => {
      const modText =
        o.modifiers.length > 0 ? ` (${o.modifiers.map((m) => m.name).join(", ")})` : "";
      const date = new Date(o.created_at).toLocaleDateString();
      return `<tr><td style="padding:4px 8px;border-bottom:1px solid #fde68a;">${date}</td><td style="padding:4px 8px;border-bottom:1px solid #fde68a;">${o.drink_name_at_order}${modText}</td><td style="padding:4px 8px;border-bottom:1px solid #fde68a;text-align:right;">${formatCents(o.total_cents)}</td></tr>`;
    })
    .join("");

  const payLinksHtml = [
    venmoLink ? `<a href="${venmoLink}" style="color:#d97706;">Pay with Venmo</a>` : "",
    paypalLink ? `<a href="${paypalLink}" style="color:#d97706;">Pay with PayPal</a>` : "",
  ]
    .filter(Boolean)
    .join(" &nbsp;|&nbsp; ");

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color:#451a03;">
      <h2 style="color:#78350f;">${settings.shop_name}</h2>
      <p>Hi ${detail.customer_name},</p>
      <p>Here's your current statement:</p>
      <table style="width:100%; border-collapse: collapse;">${rows}</table>
      <p style="font-size:18px; font-weight:bold;">Total due: ${formatCents(detail.balance_cents)}</p>
      ${payLinksHtml ? `<p>${payLinksHtml}</p>` : ""}
      <p style="color:#92400e; font-size:12px;">Thanks for your business!</p>
    </div>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Hayner's Hump Day Coffee Shop <onboarding@resend.dev>",
    to: detail.customer_email,
    subject: `${settings.shop_name} — Your bill: ${formatCents(detail.balance_cents)}`,
    html,
  });

  if (error) return { ok: false, error: error.message };

  try {
    await notifyCustomer(detail.customer_id, {
      title: "Your bill is ready 🧾",
      body: `You have ${formatCents(detail.balance_cents)} due — check your email for the statement.`,
      url: "/me",
    });
  } catch {
    // Push delivery is best-effort; the email already went out.
  }

  return { ok: true };
}

export async function saveAdminPushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("admin_push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

export async function removeAdminPushSubscription(endpoint: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("admin_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
