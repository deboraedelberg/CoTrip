-- Categories group items inside a packing list (e.g. "Ropa", "Higiene").
create table public.packing_list_categories (
  id uuid primary key default gen_random_uuid(),
  packing_list_id uuid not null references public.packing_lists (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index packing_list_categories_list_id_idx on public.packing_list_categories (packing_list_id);

alter table public.items
  add column category_id uuid references public.packing_list_categories (id) on delete set null;

create index items_category_id_idx on public.items (category_id);

alter table public.packing_list_categories enable row level security;

create policy "members read categories"
  on public.packing_list_categories for select
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = packing_list_categories.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members create categories"
  on public.packing_list_categories for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.packing_lists
      where packing_lists.id = packing_list_categories.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members update categories"
  on public.packing_list_categories for update
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = packing_list_categories.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members delete categories"
  on public.packing_list_categories for delete
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = packing_list_categories.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

alter publication supabase_realtime add table public.packing_list_categories;
