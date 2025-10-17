-- Ensure default visitor profiles and auto-provision profile rows when new auth users register.

alter table public.profiles
  alter column role set default 'visitor';

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_role text := nullif(meta->>'role', '');
  chosen_role public.user_role := 'visitor';
  first_name text := nullif(meta->>'first_name', '');
  last_name text := nullif(meta->>'last_name', '');
  full_name text := nullif(meta->>'full_name', '');
  computed_name text;
  user_locale text := nullif(meta->>'locale', '');
begin
  if meta_role is not null and meta_role = any(enum_range(null::public.user_role)::text[]) then
    chosen_role := meta_role::public.user_role;
  end if;

  if full_name is not null then
    computed_name := trim(full_name);
  else
    computed_name := trim(concat_ws(' ', first_name, last_name));
  end if;

  if computed_name is null or computed_name = '' then
    computed_name := new.email;
  end if;

  if user_locale is null or user_locale = '' then
    user_locale := 'en';
  end if;

  insert into public.profiles (id, role, full_name, locale)
  values (new.id, chosen_role, computed_name, user_locale)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

-- Backfill any auth users missing profile rows.
insert into public.profiles (id, role, full_name, locale)
select
  u.id,
  'visitor',
  coalesce(
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(trim(concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name')), ''),
    u.email
  ),
  coalesce(nullif(u.raw_user_meta_data->>'locale', ''), 'en')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
