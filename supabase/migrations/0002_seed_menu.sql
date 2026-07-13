-- Starter menu — fully editable later in the admin Menu page (Phase 4).

insert into drinks (name, description, price_cents, sort_order) values
  ('Coffee', 'Freshly brewed, hot and simple.', 150, 1),
  ('Hot Chocolate', 'Rich and cocoa-y, kid favorite.', 200, 2),
  ('Hot Tea', 'Choose your favorite bag.', 150, 3),
  ('Italian Soda', 'Fizzy and fruity, no caffeine.', 200, 4);

insert into modifiers (name, price_cents, sort_order) values
  ('Cream', 0, 1),
  ('Sugar', 0, 2),
  ('Vanilla Syrup', 50, 3),
  ('Caramel Syrup', 50, 4),
  ('Whipped Cream', 50, 5),
  ('Extra Shot', 75, 6);

insert into drink_modifiers (drink_id, modifier_id)
select d.id, m.id from drinks d, modifiers m
where d.name = 'Coffee' and m.name in ('Cream', 'Sugar', 'Vanilla Syrup', 'Caramel Syrup', 'Extra Shot');

insert into drink_modifiers (drink_id, modifier_id)
select d.id, m.id from drinks d, modifiers m
where d.name = 'Hot Chocolate' and m.name in ('Whipped Cream', 'Vanilla Syrup', 'Caramel Syrup');

insert into drink_modifiers (drink_id, modifier_id)
select d.id, m.id from drinks d, modifiers m
where d.name = 'Hot Tea' and m.name in ('Cream', 'Sugar');

insert into drink_modifiers (drink_id, modifier_id)
select d.id, m.id from drinks d, modifiers m
where d.name = 'Italian Soda' and m.name in ('Vanilla Syrup', 'Caramel Syrup', 'Whipped Cream');
