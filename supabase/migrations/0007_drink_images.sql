-- Lets the admin upload a real photo per drink, shown instead of the
-- built-in illustration wherever the drink appears.

alter table drinks add column image_url text;

-- Public bucket for drink photos. Uploads happen server-side via the
-- service-role client (Server Actions), which bypasses storage RLS, so no
-- write policy is needed here — only public read.
insert into storage.buckets (id, name, public)
values ('drink-images', 'drink-images', true)
on conflict (id) do nothing;

create policy "public can read drink images"
on storage.objects for select
to public
using (bucket_id = 'drink-images');
