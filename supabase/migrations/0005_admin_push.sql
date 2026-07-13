-- Stores web push subscriptions for barista/admin devices (any device that
-- opts in on the order board gets notified of new orders). No anon access —
-- only service_role touches this table, from admin Server Actions.

create table admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table admin_push_subscriptions enable row level security;

grant select, insert, update, delete on admin_push_subscriptions to service_role;
