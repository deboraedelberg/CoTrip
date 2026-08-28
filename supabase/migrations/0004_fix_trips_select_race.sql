-- The "members read their trips" policy only allowed rows via is_trip_member(),
-- which depends on a trip_members row that the on_trip_created trigger inserts
-- AFTER the INSERT. Postgres evaluates the SELECT policy for RETURNING before
-- that trigger runs, so creating a trip always failed with an RLS violation.
-- Letting the creator see their own row directly closes that race.
drop policy "members read their trips" on public.trips;

create policy "members read their trips"
  on public.trips for select
  to authenticated
  using (created_by = auth.uid() or public.is_trip_member(id));

-- Debug helpers and throwaway rows created while diagnosing the above.
drop function if exists public.debug_auth();
drop function if exists public.debug_trip_insert_check(uuid);
drop function if exists public.debug_trip_insert_test();
drop function if exists public.debug_trip_insert_test3(uuid);
drop function if exists public.debug_trip_insert_test4(uuid);

delete from public.trips where name in ('test debug', 'debug via rpc', 'debug via rpc 3', 'debug via rpc 4');
