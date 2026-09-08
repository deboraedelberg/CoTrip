-- Cotrip MVP schema: lists, members, invites, items.
-- Person and category are freeform attributes directly on items, not a
-- fixed hierarchy (see cotrip-mvp-from-scratch-prompt.md).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create type public.list_member_role as enum ('owner', 'member');

create table public.list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.list_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (list_id, user_id)
);

create type public.invite_status as enum ('pending', 'accepted');

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  email text not null,
  invited_by uuid not null references public.profiles (id),
  status public.invite_status not null default 'pending',
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  category text,
  assigned_to uuid references public.profiles (id) on delete set null,
  is_packed boolean not null default false,
  packed_by uuid references public.profiles (id),
  packed_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index list_members_user_id_idx on public.list_members (user_id);
create index invites_list_id_idx on public.invites (list_id);
create index invites_email_idx on public.invites (email);
create index items_list_id_idx on public.items (list_id);
create index items_assigned_to_idx on public.items (assigned_to);

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

-- New auth users (Google OAuth) get a profile row automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- List creator becomes its first (owner) member automatically.
create function public.handle_new_list()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.list_members (list_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_list_created
  after insert on public.lists
  for each row
  execute function public.handle_new_list();

-- Called by the client right after sign-in. Joins the current user to any
-- list they were invited to by email, since invitees can't read their own
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

  insert into public.list_members (list_id, user_id, role)
  select list_id, auth.uid(), 'member'
  from public.invites
  where email = current_email and status = 'pending'
  on conflict (list_id, user_id) do nothing;

  update public.invites
  set status = 'accepted'
  where email = current_email and status = 'pending';
end;
$$;

grant execute on function public.accept_pending_invites_for_current_user() to authenticated;

-- Helper used by RLS policies below: is the current user a member of a list?
create function public.is_list_member(target_list_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.list_members
    where list_id = target_list_id and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.invites enable row level security;
alter table public.items enable row level security;

create policy "profiles are readable by anyone signed in"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "members read their lists"
  on public.lists for select
  to authenticated
  using (created_by = auth.uid() or public.is_list_member(id));

create policy "signed in users create lists"
  on public.lists for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "members update their lists"
  on public.lists for update
  to authenticated
  using (public.is_list_member(id));

create policy "members read the member list"
  on public.list_members for select
  to authenticated
  using (public.is_list_member(list_id));

create policy "members read invites for their lists"
  on public.invites for select
  to authenticated
  using (public.is_list_member(list_id));

create policy "members create invites"
  on public.invites for insert
  to authenticated
  with check (public.is_list_member(list_id) and invited_by = auth.uid());

create policy "members read items"
  on public.items for select
  to authenticated
  using (public.is_list_member(list_id));

create policy "members create items"
  on public.items for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_list_member(list_id));

create policy "members update items"
  on public.items for update
  to authenticated
  using (public.is_list_member(list_id));

create policy "members delete items"
  on public.items for delete
  to authenticated
  using (public.is_list_member(list_id));

alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_members;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.invites;
