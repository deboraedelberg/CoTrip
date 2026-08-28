-- Called by the client right after sign-in. Joins the current user to any
-- trip they were invited to by email, since invitees can't read their own
-- pending invite row until they're already a member (chicken-and-egg RLS).
create function public.accept_pending_invites_for_current_user()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  current_email text;
begin
  select email into current_email from auth.users where id = auth.uid();
  if current_email is null then
    return;
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  select trip_id, auth.uid(), 'member'
  from public.invites
  where email = current_email and status = 'pending'
  on conflict (trip_id, user_id) do nothing;

  update public.invites
  set status = 'accepted', accepted_at = now()
  where email = current_email and status = 'pending';
end;
$$;

grant execute on function public.accept_pending_invites_for_current_user() to authenticated;
