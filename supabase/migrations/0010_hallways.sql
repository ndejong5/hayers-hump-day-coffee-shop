-- Phase B: delivery run sheets. Admin-defined hallway groupings used to
-- sort Made-but-not-Delivered orders into a walking-order delivery list.

create table hallways (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Rules that map a customer's room to a hallway. Evaluated in hallway
-- sort_order, then rule creation order; first match wins. "range" matches
-- on the leading number in the room string (e.g. "103" -> 103); "exact"
-- matches the whole room string case-insensitively (for non-numeric
-- locations like "Gym" or "Art Room").
create table hallway_rules (
  id uuid primary key default gen_random_uuid(),
  hallway_id uuid not null references hallways(id) on delete cascade,
  kind text not null check (kind in ('range', 'exact')),
  range_min int,
  range_max int,
  exact_value text,
  created_at timestamptz not null default now()
);

create index hallway_rules_hallway_id_idx on hallway_rules(hallway_id);

alter table hallways enable row level security;
alter table hallway_rules enable row level security;
-- No anon policies — admin-only data, read/written via the service-role
-- client only (same pattern as the settings table).

grant select, insert, update, delete on hallways to service_role;
grant select, insert, update, delete on hallway_rules to service_role;
