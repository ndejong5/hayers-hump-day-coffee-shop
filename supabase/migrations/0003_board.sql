-- Adds the window id to get_window_status() (needed by the barista board to
-- query this week's orders) and enables Realtime on the orders table.

drop function if exists get_window_status();

create or replace function get_window_status()
returns table (
  id uuid,
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
    v_window.id,
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

do $$
begin
  execute 'alter publication supabase_realtime add table orders';
exception when others then
  raise notice 'orders may already be in supabase_realtime publication: %', sqlerrm;
end $$;
