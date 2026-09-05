-- Re-assert the categories RLS policies. The client-side rename logic is
-- identical to items/packing lists (which work), so if renaming a category
-- silently reverts, the most likely cause is that the "members update
-- categories" policy from 0005 never actually landed on the live database
-- (migrations here are applied by hand, not by CI). This is idempotent and
-- safe to re-run even if the policies are already correct.
drop policy if exists "members update categories" on public.packing_list_categories;

create policy "members update categories"
  on public.packing_list_categories for update
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = packing_list_categories.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  )
  with check (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = packing_list_categories.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );
