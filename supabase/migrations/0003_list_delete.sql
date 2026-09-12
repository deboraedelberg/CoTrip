-- Lists had no delete policy at all (select/insert/update only), so
-- deletes were silently blocked by RLS. Only the owner can delete;
-- items/list_members/invites cascade via their existing FKs.
create policy "owners delete their lists"
  on public.lists for delete
  to authenticated
  using (
    exists (
      select 1 from public.list_members
      where list_id = lists.id and user_id = auth.uid() and role = 'owner'
    )
  );
