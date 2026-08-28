-- Denormalize email onto profiles so trip members can identify each other
-- (auth.users isn't queryable by other authenticated users).

alter table public.profiles add column email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;
