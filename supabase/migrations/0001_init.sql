-- CoTrip core schema: trips, members, packing lists, items, invites.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text,
  start_date date,
  end_date date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create type public.trip_member_role as enum ('owner', 'member');

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.trip_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.packing_lists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  packing_list_id uuid not null references public.packing_lists (id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  is_packed boolean not null default false,
  packed_by uuid references public.profiles (id),
  packed_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.invite_status as enum ('pending', 'accepted', 'revoked');

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid() unique,
  status public.invite_status not null default 'pending',
  invited_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index items_packing_list_id_idx on public.items (packing_list_id);
create index packing_lists_trip_id_idx on public.packing_lists (trip_id);
create index trip_members_user_id_idx on public.trip_members (user_id);
create index invites_trip_id_idx on public.invites (trip_id);
create index invites_email_idx on public.invites (email);

-- Keep items.updated_at current on every change (used to resolve realtime races).
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

-- New auth users get a profile row automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Trip creator becomes its first (owner) member automatically.
create function public.handle_new_trip()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row
  execute function public.handle_new_trip();

-- Helper used by RLS policies below: is the current user a member of a trip?
create function public.is_trip_member(target_trip_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = target_trip_id and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.packing_lists enable row level security;
alter table public.items enable row level security;
alter table public.invites enable row level security;

create policy "profiles are readable by anyone signed in"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "members read their trips"
  on public.trips for select
  to authenticated
  using (public.is_trip_member(id));

create policy "signed in users create trips"
  on public.trips for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "owners update their trips"
  on public.trips for update
  to authenticated
  using (public.is_trip_member(id));

create policy "members read the member list"
  on public.trip_members for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "members read packing lists"
  on public.packing_lists for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "members create packing lists"
  on public.packing_lists for insert
  to authenticated
  with check (public.is_trip_member(trip_id) and created_by = auth.uid());

create policy "members update packing lists"
  on public.packing_lists for update
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "members delete packing lists"
  on public.packing_lists for delete
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "members read items"
  on public.items for select
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = items.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members create items"
  on public.items for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.packing_lists
      where packing_lists.id = items.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members update items"
  on public.items for update
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = items.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members delete items"
  on public.items for delete
  to authenticated
  using (
    exists (
      select 1 from public.packing_lists
      where packing_lists.id = items.packing_list_id
        and public.is_trip_member(packing_lists.trip_id)
    )
  );

create policy "members read invites"
  on public.invites for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "members create invites"
  on public.invites for insert
  to authenticated
  with check (public.is_trip_member(trip_id) and invited_by = auth.uid());

create policy "members update invites"
  on public.invites for update
  to authenticated
  using (public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.packing_lists;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.trip_members;
