-- Expand agency profile metadata and coverage tables.
alter table public.agencies
  add column if not exists languages text[] not null default '{}',
  add column if not exists specialties text[] not null default '{}';

create table if not exists public.dmc_countries (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  country_code char(2) not null references public.countries(code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_id, country_code)
);

create table if not exists public.dmc_regions (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_id, region_id)
);

create table if not exists public.dmc_cities (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_id, city_id)
);

alter table public.dmc_countries enable row level security;
alter table public.dmc_regions enable row level security;
alter table public.dmc_cities enable row level security;

-- Policies mirror guide/transport ownership controls.
drop policy if exists "dmc_countries_select" on public.dmc_countries;
create policy "dmc_countries_select" on public.dmc_countries
  for select using (true);

drop policy if exists "dmc_countries_manage" on public.dmc_countries;
create policy "dmc_countries_manage" on public.dmc_countries
  for all using (
    public.is_admin() or public.is_org_member(agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(agency_id)
  );

drop policy if exists "dmc_regions_select" on public.dmc_regions;
create policy "dmc_regions_select" on public.dmc_regions
  for select using (true);

drop policy if exists "dmc_regions_manage" on public.dmc_regions;
create policy "dmc_regions_manage" on public.dmc_regions
  for all using (
    public.is_admin() or public.is_org_member(agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(agency_id)
  );

drop policy if exists "dmc_cities_select" on public.dmc_cities;
create policy "dmc_cities_select" on public.dmc_cities
  for select using (true);

drop policy if exists "dmc_cities_manage" on public.dmc_cities;
create policy "dmc_cities_manage" on public.dmc_cities
  for all using (
    public.is_admin() or public.is_org_member(agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(agency_id)
  );

-- Default existing agencies to empty arrays explicitly so legacy rows comply.
update public.agencies
   set languages = coalesce(languages, '{}'),
       specialties = coalesce(specialties, '{}');
