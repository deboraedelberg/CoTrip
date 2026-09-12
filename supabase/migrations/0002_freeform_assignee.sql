-- items.assigned_to becomes a freeform name, like category, instead of a
-- reference to a profiles/auth account — items can be assigned to people
-- without a Google account (e.g. "Nico").
alter table public.items drop constraint items_assigned_to_fkey;
alter table public.items alter column assigned_to type text using null::text;
