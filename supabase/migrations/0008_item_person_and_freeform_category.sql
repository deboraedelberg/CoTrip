-- Person and category become independent, freeform attributes of the item
-- instead of a fixed hierarchy. assigned_to = null means "everyone / general".
-- category = null means "sin categoría" ("Otros" in the UI). Suggested
-- categories are derived from what's already used across the trip, not
-- stored separately.
alter table public.items
  add column assigned_to uuid references public.profiles (id) on delete set null,
  add column category text;

create index items_assigned_to_idx on public.items (assigned_to);

-- Preserve existing category names as plain text on each item before the
-- managed categories table goes away.
update public.items
set category = packing_list_categories.name
from public.packing_list_categories
where items.category_id = packing_list_categories.id;

alter table public.items drop column category_id;

drop table public.packing_list_categories;
