import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  BoardOrder,
  Drink,
  Hallway,
  Modifier,
  MyOrderLine,
  Order,
  OrderLineModifier,
  PublicSettings,
  WindowStatusRow,
} from "@/lib/types";

export interface MenuDrink extends Drink {
  modifierIds: string[];
}

async function fetchMenuData(
  activeOnly: boolean
): Promise<{ drinks: MenuDrink[]; modifiers: Modifier[] }> {
  const supabase = createAdminSupabaseClient();
  let drinksQuery = supabase.from("drinks").select("*").order("sort_order");
  let modifiersQuery = supabase.from("modifiers").select("*").order("sort_order");
  if (activeOnly) {
    drinksQuery = drinksQuery.eq("is_active", true);
    modifiersQuery = modifiersQuery.eq("is_active", true);
  }

  const [{ data: drinks, error: drinksError }, { data: modifiers, error: modifiersError }, { data: links, error: linksError }] =
    await Promise.all([drinksQuery, modifiersQuery, supabase.from("drink_modifiers").select("*")]);
  if (drinksError) throw new Error(drinksError.message);
  if (modifiersError) throw new Error(modifiersError.message);
  if (linksError) throw new Error(linksError.message);

  const menuDrinks: MenuDrink[] = (drinks ?? []).map((d) => ({
    ...d,
    modifierIds: (links ?? [])
      .filter((l) => l.drink_id === d.id)
      .map((l) => l.modifier_id),
  }));

  return { drinks: menuDrinks, modifiers: modifiers ?? [] };
}

export async function getMenu(): Promise<{ drinks: MenuDrink[]; modifiers: Modifier[] }> {
  return fetchMenuData(true);
}

export async function getAdminMenu(): Promise<{ drinks: MenuDrink[]; modifiers: Modifier[] }> {
  return fetchMenuData(false);
}

export async function getWindowStatus(): Promise<WindowStatusRow> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_window_status").single();
  if (error) throw new Error(error.message);
  return data as WindowStatusRow;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_public_settings").single();
  if (error) throw new Error(error.message);
  return data as PublicSettings;
}

interface RawBoardOrderRow extends Order {
  customers: { name: string; room: string | null; photo_url: string | null } | null;
  drinks: { image_url: string | null; icon: string; prep_steps: string[] } | null;
  order_modifiers: {
    name_at_order: string;
    price_cents_at_order: number;
    modifiers: { icon: string; instruction: string | null; image_url: string | null } | null;
  }[];
}

export function mapBoardOrderRow(row: RawBoardOrderRow): BoardOrder {
  return {
    ...row,
    customer_name: row.customers?.name ?? "Unknown",
    customer_room: row.customers?.room ?? null,
    customer_photo_url: row.customers?.photo_url ?? null,
    drink_image_url: row.drinks?.image_url ?? null,
    drink_icon: row.drinks?.icon ?? "☕",
    drink_prep_steps: row.drinks?.prep_steps ?? [],
    modifiers: (row.order_modifiers ?? []).map((m) => ({
      name: m.name_at_order,
      price_cents: m.price_cents_at_order,
      icon: m.modifiers?.icon ?? "➕",
      instruction: m.modifiers?.instruction ?? null,
      image_url: m.modifiers?.image_url ?? null,
    })),
  };
}

const BOARD_ORDER_SELECT =
  "*, customers ( name, room, photo_url ), drinks ( image_url, icon, prep_steps ), order_modifiers ( name_at_order, price_cents_at_order, modifiers ( icon, instruction, image_url ) )";

export async function getBoardOrders(windowId: string): Promise<BoardOrder[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(BOARD_ORDER_SELECT)
    .eq("order_window_id", windowId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapBoardOrderRow(row as unknown as RawBoardOrderRow));
}

export async function getOrderForBoard(orderId: string): Promise<BoardOrder | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(BOARD_ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  return mapBoardOrderRow(data as unknown as RawBoardOrderRow);
}

export interface TabSummary {
  customer_id: string;
  customer_name: string;
  customer_room: string | null;
  balance_cents: number;
}

export async function getTabSummaries(): Promise<TabSummary[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("customer_id, total_cents, tip_cents, customers ( name, room )")
    .eq("payment_method", "tab")
    .is("settled_at", null);
  if (error) throw new Error(error.message);

  const byCustomer = new Map<string, TabSummary>();
  for (const row of (data ?? []) as unknown as {
    customer_id: string;
    total_cents: number;
    tip_cents: number;
    customers: { name: string; room: string | null } | null;
  }[]) {
    const amount = row.total_cents + row.tip_cents;
    const existing = byCustomer.get(row.customer_id);
    if (existing) {
      existing.balance_cents += amount;
    } else {
      byCustomer.set(row.customer_id, {
        customer_id: row.customer_id,
        customer_name: row.customers?.name ?? "Unknown",
        customer_room: row.customers?.room ?? null,
        balance_cents: amount,
      });
    }
  }

  return Array.from(byCustomer.values()).sort((a, b) => b.balance_cents - a.balance_cents);
}

export interface TabOrderLine {
  id: string;
  created_at: string;
  drink_name_at_order: string;
  modifiers: OrderLineModifier[];
  total_cents: number;
  tip_cents: number;
}

export interface CustomerTabDetail {
  customer_id: string;
  customer_name: string;
  customer_room: string | null;
  customer_email: string | null;
  balance_cents: number;
  tipsCents: number;
  orders: TabOrderLine[];
}

export async function getCustomerTabDetail(customerId: string): Promise<CustomerTabDetail | null> {
  const supabase = createAdminSupabaseClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, room, email")
    .eq("id", customerId)
    .maybeSingle();
  if (customerError) throw new Error(customerError.message);
  if (!customer) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, created_at, drink_name_at_order, total_cents, tip_cents, order_modifiers ( name_at_order, price_cents_at_order )"
    )
    .eq("customer_id", customerId)
    .eq("payment_method", "tab")
    .is("settled_at", null)
    .order("created_at", { ascending: true });
  if (ordersError) throw new Error(ordersError.message);

  const lines: TabOrderLine[] = (orders ?? []).map((o) => ({
    id: o.id,
    created_at: o.created_at,
    drink_name_at_order: o.drink_name_at_order,
    modifiers: (o.order_modifiers ?? []).map((m) => ({
      name: m.name_at_order,
      price_cents: m.price_cents_at_order,
    })),
    total_cents: o.total_cents,
    tip_cents: o.tip_cents,
  }));

  return {
    customer_id: customer.id,
    customer_name: customer.name,
    customer_room: customer.room,
    customer_email: customer.email,
    balance_cents: lines.reduce((sum, l) => sum + l.total_cents + l.tip_cents, 0),
    tipsCents: lines.reduce((sum, l) => sum + l.tip_cents, 0),
    orders: lines,
  };
}

export async function getMyOrderHistory(deviceId: string): Promise<{
  customerName: string;
  customerRoom: string | null;
  customerEmail: string | null;
  customerPhotoUrl: string | null;
  punchCount: number;
  rewardPunchesRequired: number;
  orders: MyOrderLine[];
  tabBalanceCents: number;
} | null> {
  const supabase = createAdminSupabaseClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, room, email, photo_url, punch_count")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (customerError) throw new Error(customerError.message);
  if (!customer) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, created_at, drink_name_at_order, payment_method, total_cents, tip_cents, note, made_at, delivered_at, settled_at, is_reward_redemption, order_modifiers ( name_at_order, price_cents_at_order )"
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });
  if (ordersError) throw new Error(ordersError.message);

  const lines: MyOrderLine[] = (orders ?? []).map((o) => ({
    id: o.id,
    created_at: o.created_at,
    drink_name_at_order: o.drink_name_at_order,
    payment_method: o.payment_method,
    total_cents: o.total_cents,
    tip_cents: o.tip_cents,
    note: o.note,
    made_at: o.made_at,
    delivered_at: o.delivered_at,
    settled_at: o.settled_at,
    is_reward_redemption: o.is_reward_redemption,
    modifiers: (o.order_modifiers ?? []).map((m) => ({
      name: m.name_at_order,
      price_cents: m.price_cents_at_order,
    })),
  }));

  const tabBalanceCents = lines
    .filter((o) => o.payment_method === "tab" && !o.settled_at)
    .reduce((sum, o) => sum + o.total_cents + o.tip_cents, 0);

  const settings = await getPublicSettings();

  return {
    customerName: customer.name,
    customerRoom: customer.room,
    customerEmail: customer.email,
    customerPhotoUrl: customer.photo_url,
    punchCount: customer.punch_count,
    rewardPunchesRequired: settings.reward_punches_required,
    orders: lines,
    tabBalanceCents,
  };
}

export interface CustomerPunchRow {
  id: string;
  name: string;
  room: string | null;
  punch_count: number;
}

export async function getCustomersWithPunches(): Promise<CustomerPunchRow[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, room, punch_count")
    .order("punch_count", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface CustomerPhotoRow {
  id: string;
  name: string;
  room: string | null;
  photo_url: string | null;
}

export async function getCustomersForPhotos(): Promise<CustomerPhotoRow[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, room, photo_url")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getHallways(): Promise<Hallway[]> {
  const supabase = createAdminSupabaseClient();
  const [{ data: hallways, error: hallwaysError }, { data: rules, error: rulesError }] =
    await Promise.all([
      supabase.from("hallways").select("*").order("sort_order", { ascending: true }),
      supabase.from("hallway_rules").select("*").order("created_at", { ascending: true }),
    ]);
  if (hallwaysError) throw new Error(hallwaysError.message);
  if (rulesError) throw new Error(rulesError.message);

  return (hallways ?? []).map((h) => ({
    ...h,
    rules: (rules ?? []).filter((r) => r.hallway_id === h.id),
  }));
}
