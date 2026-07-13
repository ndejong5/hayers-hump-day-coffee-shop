-- Lets the admin attach a photo per customer, used on printed drink labels
-- so students can visually match a cup to the right person.

alter table customers add column photo_url text;

insert into storage.buckets (id, name, public)
values ('customer-photos', 'customer-photos', true)
on conflict (id) do nothing;

create policy "public can read customer photos"
on storage.objects for select
to public
using (bucket_id = 'customer-photos');
