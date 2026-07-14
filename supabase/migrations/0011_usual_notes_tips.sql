-- Phase C: reorder-my-usual (no schema needed, just queries the most recent
-- order), notes to the crew, and tips.

alter table orders add column note text;
alter table orders add column tip_cents int not null default 0;

-- place_order needs two new optional params. Postgres can't add parameters
-- via CREATE OR REPLACE, so drop and recreate.
drop function if exists place_order(text, uuid, uuid[], text, boolean);

create or replace function place_order(
  p_device_id text,
  p_drink_id uuid,
  p_modifier_ids uuid[],
  p_payment_method text,
  p_is_redemption boolean,
  p_note text default null,
  p_tip_cents int default 0
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
  v_tip int := greatest(coalesce(p_tip_cents, 0), 0);
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
    payment_method, is_reward_redemption, subtotal_cents, total_cents,
    note, tip_cents
  ) values (
    v_customer.id, v_window.id, v_drink.id, v_drink.name,
    p_payment_method, p_is_redemption, 0, 0,
    nullif(trim(p_note), ''), v_tip
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

grant execute on function place_order(text, uuid, uuid[], text, boolean, text, int) to anon;
