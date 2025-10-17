-- Application tables for role-specific onboarding
create table if not exists public.agency_applications (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'en',
  legal_company_name text not null,
  registration_number text,
  registration_country char(2),
  business_address text,
  contact_email text not null,
  contact_phone text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  tax_id text,
  proof_of_license_url text,
  representative_name text,
  representative_position text,
  representative_contact jsonb not null default '{}'::jsonb,
  subscription_plan text,
  billing_details jsonb not null default '{}'::jsonb,
  company_description text,
  services_offered text[] not null default '{}',
  niche_focus text[] not null default '{}',
  destination_coverage text[] not null default '{}',
  languages_spoken text[] not null default '{}',
  certifications text[] not null default '{}',
  portfolio jsonb not null default '{}'::jsonb,
  testimonials jsonb not null default '{}'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  contact_methods jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guide_applications (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'en',
  full_name text not null,
  date_of_birth date,
  nationality char(2),
  contact_email text not null,
  contact_phone text,
  city_of_residence text,
  license_number text,
  license_authority text,
  license_proof_url text,
  specializations text[] not null default '{}',
  languages_spoken jsonb not null default '[]'::jsonb,
  expertise_areas text[] not null default '{}',
  id_document_url text,
  subscription_plan text,
  billing_details jsonb not null default '{}'::jsonb,
  operating_regions text[] not null default '{}',
  professional_intro text,
  experience_years integer,
  experience_summary text,
  sample_itineraries jsonb not null default '{}'::jsonb,
  media_gallery jsonb not null default '{}'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  contact_methods jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dmc_applications (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'en',
  legal_entity_name text not null,
  registration_number text,
  registration_country char(2),
  office_address text,
  contact_email text not null,
  contact_phone text,
  tax_id text,
  license_proof_url text,
  memberships text[] not null default '{}',
  representative_name text,
  representative_position text,
  representative_contact jsonb not null default '{}'::jsonb,
  destination_coverage text[] not null default '{}',
  services_offered text[] not null default '{}',
  specializations text[] not null default '{}',
  portfolio jsonb not null default '{}'::jsonb,
  languages_spoken text[] not null default '{}',
  certifications text[] not null default '{}',
  media_gallery jsonb not null default '{}'::jsonb,
  client_references jsonb not null default '{}'::jsonb,
  practical_info jsonb not null default '{}'::jsonb,
  contact_methods jsonb not null default '{}'::jsonb,
  subscription_plan text,
  billing_details jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transport_applications (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'en',
  legal_entity_name text not null,
  registration_number text,
  registration_country char(2),
  company_address text,
  contact_email text not null,
  contact_phone text,
  fleet_documents jsonb not null default '{}'::jsonb,
  insurance_documents jsonb not null default '{}'::jsonb,
  safety_certifications text[] not null default '{}',
  representative_name text,
  representative_position text,
  representative_contact jsonb not null default '{}'::jsonb,
  service_areas text[] not null default '{}',
  fleet_overview jsonb not null default '{}'::jsonb,
  service_types text[] not null default '{}',
  safety_features text[] not null default '{}',
  languages_spoken text[] not null default '{}',
  media_gallery jsonb not null default '{}'::jsonb,
  client_references jsonb not null default '{}'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  booking_info jsonb not null default '{}'::jsonb,
  pricing_summary jsonb not null default '{}'::jsonb,
  subscription_plan text,
  billing_details jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agency_applications_touch_updated_at
  before update on public.agency_applications
  for each row execute function public.touch_updated_at();

create trigger guide_applications_touch_updated_at
  before update on public.guide_applications
  for each row execute function public.touch_updated_at();

create trigger dmc_applications_touch_updated_at
  before update on public.dmc_applications
  for each row execute function public.touch_updated_at();

create trigger transport_applications_touch_updated_at
  before update on public.transport_applications
  for each row execute function public.touch_updated_at();

alter table public.agency_applications enable row level security;
alter table public.guide_applications enable row level security;
alter table public.dmc_applications enable row level security;
alter table public.transport_applications enable row level security;

drop policy if exists "agency_applications_select_own" on public.agency_applications;
create policy "agency_applications_select_own" on public.agency_applications
  for select using (
    public.is_admin()
    or (contact_email = current_setting('request.jwt.claims'::text)::json->>'email')
  );

drop policy if exists "guide_applications_select_own" on public.guide_applications;
create policy "guide_applications_select_own" on public.guide_applications
  for select using (
    public.is_admin()
    or (contact_email = current_setting('request.jwt.claims'::text)::json->>'email')
  );

drop policy if exists "dmc_applications_select_own" on public.dmc_applications;
create policy "dmc_applications_select_own" on public.dmc_applications
  for select using (
    public.is_admin()
    or (contact_email = current_setting('request.jwt.claims'::text)::json->>'email')
  );

drop policy if exists "transport_applications_select_own" on public.transport_applications;
create policy "transport_applications_select_own" on public.transport_applications
  for select using (
    public.is_admin()
    or (contact_email = current_setting('request.jwt.claims'::text)::json->>'email')
  );

-- Inserts handled by trusted server actions
