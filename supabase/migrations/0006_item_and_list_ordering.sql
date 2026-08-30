-- Manual drag-to-reorder for items (within their category) and packing lists
-- (the per-person tabs). Categories already had a `position` column.

alter table public.items add column position integer not null default 0;
alter table public.packing_lists add column position integer not null default 0;

-- Backfill existing rows using their current creation order, scoped the same
-- way the UI groups them: items within (packing_list_id, category_id), and
-- packing lists within trip_id.
with ranked as (
  select id, row_number() over (
    partition by packing_list_id, category_id order by created_at
  ) - 1 as rn
  from public.items
)
update public.items
set position = ranked.rn
from ranked
where items.id = ranked.id;

with ranked as (
  select id, row_number() over (partition by trip_id order by created_at) - 1 as rn
  from public.packing_lists
)
update public.packing_lists
set position = ranked.rn
from ranked
where packing_lists.id = ranked.id;
