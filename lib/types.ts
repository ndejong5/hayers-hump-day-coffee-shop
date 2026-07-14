export type PaymentMethod = "cash" | "tab";
export type ManualWindowState = "auto" | "forced_open" | "forced_closed";
export type WindowStatus = "open" | "closed_cap" | "closed_admin";

export interface Customer {
  id: string;
  device_id: string;
  name: string;
  room: string | null;
  email: string | null;
  photo_url: string | null;
  punch_count: number;
  created_at: string;
}

export interface Drink {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  icon: string;
  prep_steps: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Modifier {
  id: string;
  name: string;
  price_cents: number;
  icon: string;
  image_url: string | null;
  instruction: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DrinkModifier {
  drink_id: string;
  modifier_id: string;
}

export interface OrderWindow {
  id: string;
  week_start: string;
  cap: number;
  manual_state: ManualWindowState;
  order_count: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_window_id: string;
  drink_id: string;
  drink_name_at_order: string;
  payment_method: PaymentMethod;
  is_reward_redemption: boolean;
  subtotal_cents: number;
  total_cents: number;
  made_at: string | null;
  delivered_at: string | null;
  cash_collected: boolean | null;
  settled_at: string | null;
  created_at: string;
}

export interface OrderModifier {
  id: string;
  order_id: string;
  modifier_id: string | null;
  name_at_order: string;
  price_cents_at_order: number;
}

export interface PublicSettings {
  shop_name: string;
  reward_punches_required: number;
  modifiers_charge_on_reward: boolean;
  venmo_link: string | null;
  paypal_link: string | null;
}

export interface WindowStatusRow {
  id: string;
  week_start: string;
  cap: number;
  order_count: number;
  manual_state: ManualWindowState;
  status: WindowStatus;
  slots_remaining: number;
}

export interface OrderLineModifier {
  name: string;
  price_cents: number;
}

export interface BoardOrderModifier extends OrderLineModifier {
  icon: string;
  instruction: string | null;
  image_url: string | null;
}

export interface BoardOrder extends Order {
  customer_name: string;
  customer_room: string | null;
  customer_photo_url: string | null;
  drink_image_url: string | null;
  drink_icon: string;
  drink_prep_steps: string[];
  modifiers: BoardOrderModifier[];
}

export interface MyOrderLine {
  id: string;
  created_at: string;
  drink_name_at_order: string;
  payment_method: PaymentMethod;
  total_cents: number;
  made_at: string | null;
  delivered_at: string | null;
  settled_at: string | null;
  is_reward_redemption: boolean;
  modifiers: OrderLineModifier[];
}
