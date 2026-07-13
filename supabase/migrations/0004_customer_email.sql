-- Adds an email column to customers (nullable at the DB level so existing
-- rows aren't broken; the app enforces "required" for new signups in the UI).
-- Updates get_or_create_customer to accept and store it.

alter table customers add column if not exists email text;

drop function if exists get_or_create_customer(text, text, text);

create or replace function get_or_create_customer(
  p_device_id text,
  p_name text,
  p_room text,
  p_email text
)
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

  insert into customers (device_id, name, room, email)
  values (p_device_id, p_name, nullif(p_room, ''), nullif(p_email, ''))
  returning * into v_customer;

  return v_customer;
end;
$$;

grant execute on function get_or_create_customer(text, text, text, text) to anon;

-- Lets a customer add/update their own email later (e.g. from the /me page)
-- by device_id, since that's the only "credential" customers have.
create or replace function update_customer_email(p_device_id text, p_email text)
returns customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer customers;
begin
  update customers set email = nullif(p_email, '')
    where device_id = p_device_id
    returning * into v_customer;

  if not found then
    raise exception 'customer_not_found';
  end if;

  return v_customer;
end;
$$;

grant execute on function update_customer_email(text, text) to anon;
