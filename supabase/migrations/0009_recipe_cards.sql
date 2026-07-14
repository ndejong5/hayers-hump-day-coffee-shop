-- Phase A: student prep view. Adds icon + prep steps to drinks, and icon +
-- optional photo + optional custom instruction to modifiers. No changes to
-- order_modifiers or place_order — modifier quantity is handled by the
-- picker sending the same modifier_id multiple times, which the existing
-- insert loop already supports (one row per unit).

alter table drinks add column icon text not null default '☕';
alter table drinks add column prep_steps text[] not null default '{}';

alter table modifiers add column icon text not null default '➕';
alter table modifiers add column image_url text;
alter table modifiers add column instruction text;

-- Sensible defaults for the seeded menu so it looks right before any
-- manual customization.
update drinks set icon = '☕' where name ilike '%coffee%';
update drinks set icon = '🍫' where name ilike '%chocolate%';
update drinks set icon = '🍵' where name ilike '%tea%';
update drinks set icon = '🥤' where name ilike '%soda%' or name ilike '%italian%';

update modifiers set icon = '🥛' where name ilike '%cream%' and name not ilike '%whipped%';
update modifiers set icon = '🍨' where name ilike '%whipped%';
update modifiers set icon = '🍬' where name ilike '%sugar%';
update modifiers set icon = '🍦' where name ilike '%vanilla%';
update modifiers set icon = '🍯' where name ilike '%caramel%';
update modifiers set icon = '☕' where name ilike '%shot%' or name ilike '%espresso%';
update modifiers set icon = '🥛' where name ilike '%milk%';
