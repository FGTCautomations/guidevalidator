-- Transport fleet, media uploads, and chat attachments
create table if not exists public.transport_fleet (
  id uuid primary key default gen_random_uuid(),
  transport_agency_id uuid not null references public.agencies(id) on delete cascade,
  name text,
  vehicle_type text not null,
  capacity integer,
  supports_airport_transfer boolean not null default false,
  supports_wheelchair boolean not null default false,
  supports_vip boolean not null default false,
  languages text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

select public.ensure_trigger(
  'public',
  'transport_fleet',
  'transport_fleet_touch_updated_at',
  $SQL$
  create trigger transport_fleet_touch_updated_at
    before update on public.transport_fleet
    for each row execute function public.touch_updated_at()
  $SQL$
);
create table if not exists public.transport_countries (
  transport_agency_id uuid not null references public.agencies(id) on delete cascade,
  country_code char(2) not null references public.countries(code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transport_agency_id, country_code)
);

create table if not exists public.transport_regions (
  transport_agency_id uuid not null references public.agencies(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transport_agency_id, region_id)
);

create table if not exists public.transport_cities (
  transport_agency_id uuid not null references public.agencies(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transport_agency_id, city_id)
);

-- Generalized file uploads for media and documents
create table if not exists public.file_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.agencies(id) on delete set null,
  purpose text not null,
  storage_bucket text not null,
  storage_path text not null,
  file_name text,
  content_type text,
  size_bytes bigint,
  checksum text,
  status text not null default 'pending',
  virus_scan_status text not null default 'pending',
  ocr_status text not null default 'pending',
  moderation_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists file_uploads_bucket_path_idx on public.file_uploads(storage_bucket, storage_path);

select public.ensure_trigger(
  'public',
  'file_uploads',
  'file_uploads_touch_updated_at',
  $SQL$
  create trigger file_uploads_touch_updated_at
    before update on public.file_uploads
    for each row execute function public.touch_updated_at()
  $SQL$
);
create table if not exists public.file_moderation_events (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.file_uploads(id) on delete cascade,
  reviewer_profile_id uuid references public.profiles(id),
  status text not null,
  reason text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- Chat attachments referencing uploads
create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_id uuid not null references public.file_uploads(id) on delete cascade,
  storage_path text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create unique index if not exists message_attachments_file_unique on public.message_attachments(file_id);

-- Enable RLS
alter table public.transport_fleet enable row level security;
alter table public.transport_countries enable row level security;
alter table public.transport_regions enable row level security;
alter table public.transport_cities enable row level security;
alter table public.file_uploads enable row level security;
alter table public.file_moderation_events enable row level security;
alter table public.message_attachments enable row level security;

-- Policies
drop policy if exists "transport_fleet_select" on public.transport_fleet;
create policy "transport_fleet_select" on public.transport_fleet
  for select using (true);

drop policy if exists "transport_fleet_manage" on public.transport_fleet;
create policy "transport_fleet_manage" on public.transport_fleet
  for all using (
    public.is_admin() or public.is_org_member(transport_agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(transport_agency_id)
  );

drop policy if exists "transport_countries_select" on public.transport_countries;
create policy "transport_countries_select" on public.transport_countries
  for select using (true);
drop policy if exists "transport_countries_manage" on public.transport_countries;
create policy "transport_countries_manage" on public.transport_countries
  for all using (
    public.is_admin() or public.is_org_member(transport_agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(transport_agency_id)
  );

drop policy if exists "transport_regions_select" on public.transport_regions;
create policy "transport_regions_select" on public.transport_regions
  for select using (true);
drop policy if exists "transport_regions_manage" on public.transport_regions;
create policy "transport_regions_manage" on public.transport_regions
  for all using (
    public.is_admin() or public.is_org_member(transport_agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(transport_agency_id)
  );

drop policy if exists "transport_cities_select" on public.transport_cities;
create policy "transport_cities_select" on public.transport_cities
  for select using (true);
drop policy if exists "transport_cities_manage" on public.transport_cities;
create policy "transport_cities_manage" on public.transport_cities
  for all using (
    public.is_admin() or public.is_org_member(transport_agency_id)
  ) with check (
    public.is_admin() or public.is_org_member(transport_agency_id)
  );

drop policy if exists "file_uploads_select" on public.file_uploads;
create policy "file_uploads_select" on public.file_uploads
  for select using (
    public.is_admin()
    or owner_profile_id = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

drop policy if exists "file_uploads_manage_owner" on public.file_uploads;
create policy "file_uploads_manage_owner" on public.file_uploads
  for insert with check (
    owner_profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "file_uploads_update_owner" on public.file_uploads;
create policy "file_uploads_update_owner" on public.file_uploads
  for update using (
    public.is_admin()
    or owner_profile_id = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  ) with check (
    public.is_admin()
    or owner_profile_id = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

drop policy if exists "file_uploads_admin_delete" on public.file_uploads;
create policy "file_uploads_admin_delete" on public.file_uploads
  for delete using (public.is_admin());

drop policy if exists "file_moderation_events_select" on public.file_moderation_events;
create policy "file_moderation_events_select" on public.file_moderation_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.file_uploads fu
      where fu.id = file_id
        and (fu.owner_profile_id = auth.uid()
          or (fu.organization_id is not null and public.is_org_member(fu.organization_id))
        )
    )
  );

drop policy if exists "file_moderation_events_manage_admin" on public.file_moderation_events;
create policy "file_moderation_events_manage_admin" on public.file_moderation_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "message_attachments_select" on public.message_attachments;
create policy "message_attachments_select" on public.message_attachments
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.messages m
      where m.id = message_id
        and public.is_conversation_participant(m.conversation_id)
    )
  );

drop policy if exists "message_attachments_manage" on public.message_attachments;
create policy "message_attachments_manage" on public.message_attachments
  for insert with check (
    exists (
      select 1
      from public.messages m
      where m.id = message_id
        and m.sender_id = auth.uid()
    )
  );

drop policy if exists "message_attachments_admin" on public.message_attachments;
create policy "message_attachments_admin" on public.message_attachments
  for all using (public.is_admin()) with check (public.is_admin());











