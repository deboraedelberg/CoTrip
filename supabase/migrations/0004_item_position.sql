-- Manual drag-to-reorder needs a sortable position independent of
-- created_at. Backfill existing rows in their current (created_at) order.
alter table public.items add column position double precision;

update public.items
set position = sub.rn
from (
  select id, row_number() over (partition by list_id order by created_at) as rn
  from public.items
) sub
where public.items.id = sub.id;

alter table public.items alter column position set not null;
alter table public.items alter column position set default 0;

create index items_list_id_position_idx on public.items (list_id, position);
