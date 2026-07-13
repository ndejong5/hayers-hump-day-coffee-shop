-- Bower Coffee Shop — initial schema
-- Run this in the Supabase SQL Editor (see setup walkthrough).

-- ===== Tables =====

create table customers (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  name text not null,
  room text,
  punch_count int not null default 0,
  created_at timestamptz not null default now()
);

create table drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents int not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents int not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table drink_modifiers (
  drink_id uuid not null references drinks(id) on delete cascade,
  modifier_id uuid not null references modifiers(id) on delete cascade,
  primary key (drink_id, modifier_id)
);

create table order_windows (
  id uuid primary key default gen_random_uuid(),
  week_start date unique not null,
  cap int not null default 30,
  manual_state text not null default 'auto' check (manual_state in ('auto','forced_open','forced_closed')),
  order_count int not null default 0,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  order_window_id uuid not null references order_windows(id) on delete restrict,
  drink_id uuid not null references drinks(id) on delete restrict,
  drink_name_at_order text not null,
  payment_method text not null check (payment_method in ('cash','tab')),
  is_reward_redemption boolean not null default false,
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  made_at timestamptz,
  delivered_at timestamptz,
  cash_collected boolean,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table order_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  modifier_id uuid references modifiers(id) on delete set null,
  name_at_order text not null,
  price_cents_at_order int not null default 0
);

create table settings (
  id int primary key default 1,
  pin_hash text not null,
  reward_punches_required int not null default 10,
  modifiers_charge_on_reward boolean not null default true,
  venmo_link text,
  paypal_link text,
  shop_name text not null default 'Bower Coffee Shop',
  constraint settings_singleton check (id = 1)
);

create index orders_customer_id_idx on orders(customer_id);
create index orders_order_window_id_idx on orders(order_window_id);
create index orders_drink_id_idx on orders(drink_id);
create index order_modifiers_order_id_idx on order_modifiers(order_id);
create index drink_modifiers_drink_id_idx on drink_modifiers(drink_id);

-- ===== Row Level Security =====
-- No Supabase Auth is used. The browser only ever talks to Postgres with the
-- anon key. Anon gets read-only SELECT on customer-facing tables, plus
-- EXECUTE on a handful of SECURITY DEFINER functions below for the writes it
-- needs (creating a customer, placing an order, reading window status).
-- All admin writes (menu edits, marking orders made/delivered, settling tabs,
-- window controls) happen in Next.js Server Actions using the service role
-- key, which bypasses RLS entirely and never reaches the browser.

alter table customers enable row level security;
alter table drinks enable row level security;
alter table modifiers enable row level security;
alter table drink_modifiers enable row level security;
alter table order_windows enable row level security;
alter table orders enable row level security;
alter table order_modifiers enable row level security;
alter table settings enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on customers to anon;
grant select on drinks to anon;
grant select on modifiers to anon;
grant select on drink_modifiers to anon;
grant select on order_windows to anon;
grant select on orders to anon;
grant select on order_modifiers to anon;
-- deliberately no grant on settings for anon (holds pin_hash)

create policy "anon can read customers" on customers for select to anon using (true);
create policy "anon can read drinks" on drinks for select to anon using (true);
create policy "anon can read modifiers" on modifiers for select to anon using (true);
create policy "anon can read drink_modifiers" on drink_modifiers for select to anon using (true);
create policy "anon can read order_windows" on order_windows for select to anon using (true);
create policy "anon can read orders" on orders for select to anon using (true);
create policy "anon can read order_modifiers" on order_modifiers for select to anon using (true);

grant select, insert, update, delete on all tables in schema public to service_role;

-- ===== Functions =====

-- Creates this week's order_windows row on first access if it doesn't exist
-- yet, inheriting the cap from the most recent prior week.
create or replace function ensure_current_window()
returns order_windows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := (date_trunc('week', now())::date);
  v_window order_windows;
  v_default_cap int;
begin
  select cap into v_default_cap from order_windows order by week_start desc limit 1;
  if v_default_cap is null then
    v_default_cap := 30;
  end if;

  insert into order_windows (week_start, cap)
  values (v_week_start, v_default_cap)
  on conflict (week_start) do nothing;

  select * into v_window from order_windows where week_start = v_week_start;
  return v_window;
end;
$$;

revoke execute on function ensure_current_window() from public;
grant execute on function ensure_current_window() to service_role;

create or replace function get_window_status()
returns table (
  week_start date,
  cap int,
  order_count int,
  manual_state text,
  status text,
  slots_remaining int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window order_windows;
begin
  v_window := ensure_current_window();
  return query select
    v_window.week_start,
    v_window.cap,
    v_window.order_count,
    v_window.manual_state,
    case
      when v_window.manual_state = 'forced_closed' then 'closed_admin'
      when v_window.order_count >= v_window.cap then 'closed_cap'
      else 'open'
    end,
    greatest(v_window.cap - v_window.order_count, 0);
end;
$$;

grant execute on function get_window_status() to anon;

create or replace function get_public_settings()
returns table (
  shop_name text,
  reward_punches_required int,
  modifiers_charge_on_reward boolean,
  venmo_link text,
  paypal_link text
)
language sql
security definer
set search_path = public
as $$
  select shop_name, reward_punches_required, modifiers_charge_on_reward, venmo_link, paypal_link
  from settings where id = 1;
$$;

grant execute on function get_public_settings() to anon;

-- Looks up a customer by device_id, or creates one on first visit.
create or replace function get_or_create_customer(p_device_id text, p_name text, p_room text)
returns customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer customers;
begin
  select * into v_customer from customers where device_id = p_device_id;
  if found then
    return v_customer;
  end if;

  insert into customers (device_id, name, room)
  values (p_device_id, p_name, nullif(p_room, ''))
  returning * into v_customer;

  return v_customer;
end;
$$;

grant execute on function get_or_create_customer(text, text, text) to anon;

-- Atomically checks the order window cap and inserts an order + its
-- modifiers. Locks the current week's order_windows row so two customers
-- racing for the last slot can't both succeed.
create or replace function place_order(
  p_device_id text,
  p_drink_id uuid,
  p_modifier_ids uuid[],
  p_payment_method text,
  p_is_redemption boolean
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer customers;
  v_window order_windows;
  v_drink drinks;
  v_settings settings;
  v_modifier modifiers;
  v_modifier_id uuid;
  v_subtotal int := 0;
  v_total int := 0;
  v_order orders;
begin
  select * into v_customer from customers where device_id = p_device_id;
  if not found then
    raise exception 'customer_not_found';
  end if;

  select * into v_drink from drinks where id = p_drink_id and is_active;
  if not found then
    raise exception 'drink_not_found';
  end if;

  select * into v_settings from settings where id = 1;

  perform ensure_current_window();
  select * into v_window from order_windows
    where week_start = (date_trunc('week', now())::date)
    for update;

  if v_window.manual_state = 'forced_closed' then
    raise exception 'window_closed';
  end if;
  if v_window.order_count >= v_window.cap then
    raise exception 'cap_reached';
  end if;

  if p_is_redemption and v_customer.punch_count < v_settings.reward_punches_required then
    raise exception 'not_enough_punches';
  end if;

  v_subtotal := v_drink.price_cents;

  insert into orders (
    customer_id, order_window_id, drink_id, drink_name_at_order,
    payment_method, is_reward_redemption, subtotal_cents, total_cents
  ) values (
    v_customer.id, v_window.id, v_drink.id, v_drink.name,
    p_payment_method, p_is_redemption, 0, 0
  ) returning * into v_order;

  if p_modifier_ids is not null then
    foreach v_modifier_id in array p_modifier_ids loop
      select * into v_modifier from modifiers where id = v_modifier_id and is_active;
      if found then
        insert into order_modifiers (order_id, modifier_id, name_at_order, price_cents_at_order)
        values (v_order.id, v_modifier.id, v_modifier.name, v_modifier.price_cents);
        v_subtotal := v_subtotal + v_modifier.price_cents;
      end if;
    end loop;
  end if;

  if p_is_redemption then
    if v_settings.modifiers_charge_on_reward then
      v_total := v_subtotal - v_drink.price_cents; -- drink is free, modifiers still charge
    else
      v_total := 0;
    end if;
    update customers set punch_count = punch_count - v_settings.reward_punches_required
      where id = v_customer.id;
  else
    v_total := v_subtotal;
  end if;

  update orders set subtotal_cents = v_subtotal, total_cents = v_total where id = v_order.id;
  update order_windows set order_count = order_count + 1 where id = v_window.id;

  select * into v_order from orders where id = v_order.id;
  return v_order;
end;
$$;

grant execute on function place_order(text, uuid, uuid[], text, boolean) to anon;

-- ===== Admin-only functions (service_role only, called from Server Actions) =====

create or replace function mark_order_made(p_order_id uuid)
returns orders
language sql
as $$
  update orders set made_at = now() where id = p_order_id and made_at is null
  returning *;
$$;

revoke execute on function mark_order_made(uuid) from public;
grant execute on function mark_order_made(uuid) to service_role;

-- Marks an order delivered, records cash_collected for cash orders, and
-- awards a rewards punch the first time (not for redemption orders).
create or replace function mark_order_delivered(p_order_id uuid, p_cash_collected boolean default null)
returns orders
language plpgsql
as $$
declare
  v_was_delivered boolean;
  v_order orders;
begin
  select (delivered_at is not null) into v_was_delivered from orders where id = p_order_id;
  if v_was_delivered is null then
    raise exception 'order_not_found';
  end if;

  update orders
    set delivered_at = coalesce(delivered_at, now()),
        cash_collected = case when payment_method = 'cash' then coalesce(p_cash_collected, cash_collected) else cash_collected end
    where id = p_order_id
    returning * into v_order;

  if not v_was_delivered and not v_order.is_reward_redemption then
    update customers set punch_count = punch_count + 1 where id = v_order.customer_id;
  end if;

  return v_order;
end;
$$;

revoke execute on function mark_order_delivered(uuid, boolean) from public;
grant execute on function mark_order_delivered(uuid, boolean) to service_role;

-- ===== Seed settings row =====
-- Default admin PIN is 1234 (bcrypt hash below). Change it after setup by
-- running `node scripts/hash-pin.mjs <new-pin>` and updating this row's
-- pin_hash in the Supabase Table Editor.
insert into settings (id, pin_hash, shop_name)
values (1, '$2b$10$prHPiwYU2WPMXpW4X0Th6.Tb4rko.PDJso6Bwy9f53fcbnzhTGSEy', 'Bower Coffee Shop');
