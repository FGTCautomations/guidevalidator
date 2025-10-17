drop policy if exists "profiles_select_self_or_admin" on public.profiles;

create policy "profiles_select_self_or_admin"
  on public.profiles
  for select
  using (
    (
      auth.uid() is not null
      and id = auth.uid()
    )
    or (
      auth.uid() is not null
      and public.is_admin()
    )
  );

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','super_admin')
  );
$$;

alter function public.is_admin() owner to postgres;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  );
$$;

alter function public.is_super_admin() owner to postgres;

create or replace function public.is_org_member(target_agency uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.agency_members am
    where am.agency_id = target_agency
      and am.profile_id = auth.uid()
      and am.removed_at is null
  );
$$;

alter function public.is_org_member(target_agency uuid) owner to postgres;