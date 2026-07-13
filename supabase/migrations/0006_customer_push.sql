-- Stores web push subscriptions for customer devices (opted in from /me).
-- No anon access — only service_role touches this table, from Server Actions
-- that already look the customer up by device_id.

create table customer_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index customer_push_subscriptions_customer_id_idx
  on customer_push_subscriptions(customer_id);

alter table customer_push_subscriptions enable row level security;

grant select, insert, update, delete on customer_push_subscriptions to service_role;
