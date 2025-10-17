-- Enforce guide licensing for specific countries and sync profile verification state.
-- Ensure required countries exist.
insert into public.countries (code, name)
values
  ('DZ', 'Algeria'),
  ('BT', 'Bhutan'),
  ('CN', 'China'),
  ('FR', 'France'),
  ('GR', 'Greece'),
  ('IN', 'India'),
  ('IR', 'Iran'),
  ('IT', 'Italy'),
  ('JP', 'Japan'),
  ('LY', 'Libya'),
  ('KP', 'North Korea'),
  ('ES', 'Spain'),
  ('SY', 'Syria'),
  ('TM', 'Turkmenistan'),
  ('GB', 'United Kingdom'),
  ('US', 'United States'),
  ('VN', 'Vietnam')
on conflict (code) do nothing;

insert into public.country_licensing_rules (country_code, guide_license_required, updated_at)
values
  ('DZ', true, now()), -- Algeria
  ('BT', true, now()), -- Bhutan
  ('CN', true, now()), -- China
  ('FR', true, now()), -- France
  ('GR', true, now()), -- Greece
  ('IN', true, now()), -- India
  ('IR', true, now()), -- Iran
  ('IT', true, now()), -- Italy
  ('JP', true, now()), -- Japan
  ('LY', true, now()), -- Libya
  ('KP', true, now()), -- North Korea
  ('ES', true, now()), -- Spain
  ('SY', true, now()), -- Syria
  ('TM', true, now()), -- Turkmenistan
  ('GB', true, now()), -- United Kingdom
  ('US', true, now()), -- United States
  ('VN', true, now())  -- Vietnam
on conflict (country_code)
  do update set
    guide_license_required = excluded.guide_license_required,
    updated_at = now();

create or replace function public.ensure_guide_country_license()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requires_license boolean := false;
  has_license boolean := false;
begin
  select guide_license_required
    into requires_license
    from public.country_licensing_rules
   where country_code = new.country_code;

  if not requires_license then
    return new;
  end if;

  select exists (
      select 1
        from public.guide_credentials gc
       where gc.guide_id = new.guide_id
         and gc.country_code = new.country_code
         and gc.status = 'approved'
         and (gc.expires_at is null or gc.expires_at >= current_date)
    )
    into has_license;

  if has_license then
    return new;
  end if;

  raise exception 'A valid guide license is required for country %', new.country_code;
end;
$$;

drop trigger if exists guide_countries_require_license on public.guide_countries;
create trigger guide_countries_require_license
  before insert or update on public.guide_countries
  for each row execute function public.ensure_guide_country_license();

create or replace function public.sync_profile_license_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.guide_id, old.guide_id);
  affected_country char(2) := coalesce(new.country_code, old.country_code);
  requires_license boolean := false;
  has_valid boolean := false;
begin
  select exists (
      select 1
        from public.guide_credentials gc
       where gc.guide_id = target
         and gc.status = 'approved'
         and (gc.expires_at is null or gc.expires_at >= current_date)
    ) into has_valid;

  update public.profiles
     set license_verified = has_valid
   where id = target;

  if affected_country is not null then
    select guide_license_required
      into requires_license
      from public.country_licensing_rules
     where country_code = affected_country;

    if requires_license and not has_valid then
      if exists (
        select 1
          from public.guide_countries gc
         where gc.guide_id = target
           and gc.country_code = affected_country
      ) then
        raise exception 'Removing the license would leave guide % without approval for %', target, affected_country;
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists guide_credentials_sync_insert on public.guide_credentials;
drop trigger if exists guide_credentials_sync_update on public.guide_credentials;
drop trigger if exists guide_credentials_sync_delete on public.guide_credentials;

create trigger guide_credentials_sync_insert
  after insert on public.guide_credentials
  for each row execute function public.sync_profile_license_state();

create trigger guide_credentials_sync_update
  after update on public.guide_credentials
  for each row execute function public.sync_profile_license_state();

create trigger guide_credentials_sync_delete
  after delete on public.guide_credentials
  for each row execute function public.sync_profile_license_state();

-- Backfill license_verified flags for existing guides.
update public.profiles p
   set license_verified = exists (
     select 1
       from public.guide_credentials gc
      where gc.guide_id = p.id
        and gc.status = 'approved'
        and (gc.expires_at is null or gc.expires_at >= current_date)
   )
 where p.role = 'guide';
