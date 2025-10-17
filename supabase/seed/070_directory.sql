-- Sample directory entities for demo purposes
-- Guides
with berlin_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    coalesce((select id from auth.users where email = 'guide.berlin@guidevalidator.test'), gen_random_uuid()),
    'guide.berlin@guidevalidator.test',
    crypt('SecurePass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Eva M?ller"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data
  returning id
), berlin_profile as (
  insert into public.profiles (id, role, full_name, locale, verified, license_verified, country_code, onboarding_completed)
  select id, 'guide', 'Eva M?ller', 'de', true, true, 'DE', true from berlin_user
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    license_verified = excluded.license_verified,
    onboarding_completed = excluded.onboarding_completed
  returning id
)
insert into public.guides (profile_id, headline, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, has_liability_insurance, response_time_minutes)
select id,
       'Private tours across Berlin & Potsdam',
       ARRAY['history','architecture','family-friendly'],
       ARRAY['de','en','es'],
       9000,
       'EUR',
       8,
       true,
       48
from berlin_profile
on conflict (profile_id) do update set
  headline = excluded.headline,
  specialties = excluded.specialties,
  spoken_languages = excluded.spoken_languages,
  hourly_rate_cents = excluded.hourly_rate_cents,
  years_experience = excluded.years_experience,
  has_liability_insurance = excluded.has_liability_insurance,
  response_time_minutes = excluded.response_time_minutes;

insert into public.guide_regions (guide_id, region_id)
select berlin_profile.id, r.id
from berlin_profile
join public.regions r on r.country_code = 'DE' and r.region_code = 'BE'
on conflict do nothing;

-- Tokyo guide
with tokyo_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    coalesce((select id from auth.users where email = 'guide.tokyo@guidevalidator.test'), gen_random_uuid()),
    'guide.tokyo@guidevalidator.test',
    crypt('SecurePass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Kenji Nakamura"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data
  returning id
), tokyo_profile as (
  insert into public.profiles (id, role, full_name, locale, verified, license_verified, country_code, onboarding_completed)
  select id, 'guide', 'Kenji Nakamura', 'ja', true, true, 'JP', true from tokyo_user
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    license_verified = excluded.license_verified,
    onboarding_completed = excluded.onboarding_completed
  returning id
)
insert into public.guides (profile_id, headline, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, has_liability_insurance, response_time_minutes)
select id,
       'Licensed guide for the Kanto region',
       ARRAY['food','corporate','culture'],
       ARRAY['ja','en'],
       11000,
       'JPY',
       10,
       true,
       36
from tokyo_profile
on conflict (profile_id) do update set
  headline = excluded.headline,
  specialties = excluded.specialties,
  spoken_languages = excluded.spoken_languages,
  hourly_rate_cents = excluded.hourly_rate_cents,
  years_experience = excluded.years_experience,
  has_liability_insurance = excluded.has_liability_insurance,
  response_time_minutes = excluded.response_time_minutes;

insert into public.guide_regions (guide_id, region_id)
select tokyo_profile.id, r.id
from tokyo_profile
join public.regions r on r.country_code = 'JP' and r.region_code = '13'
on conflict do nothing;

-- DMC sample
insert into public.agencies (id, type, name, slug, country_code, coverage_summary, verified, featured)
select
  coalesce((select id from public.agencies where slug = 'catalunya-experiences'), gen_random_uuid()),
  'dmc',
  'Catalunya Experiences',
  'catalunya-experiences',
  'ES',
  'Barcelona & Girona luxury programmes',
  true,
  true
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  coverage_summary = excluded.coverage_summary,
  verified = excluded.verified,
  featured = excluded.featured;

-- Transport sample
with transport_agency as (
  insert into public.agencies (id, type, name, slug, country_code, coverage_summary, verified, featured)
  select
    coalesce((select id from public.agencies where slug = 'emerald-sprinters'), gen_random_uuid()),
    'transport',
    'Emerald Sprinters',
    'emerald-sprinters',
    'DE',
    'Premium sprinters with bilingual drivers',
    true,
    false
  on conflict (slug) do update set
    name = excluded.name,
    country_code = excluded.country_code,
    coverage_summary = excluded.coverage_summary,
    verified = excluded.verified,
    featured = excluded.featured
  returning id
)
insert into public.transport_fleet (id, transport_agency_id, name, vehicle_type, capacity, supports_airport_transfer, supports_wheelchair, supports_vip, languages)
select
  coalesce((select id from public.transport_fleet where transport_agency_id = transport_agency.id and name = 'Mercedes Sprinter Fleet'), gen_random_uuid()),
  transport_agency.id,
  'Mercedes Sprinter Fleet',
  'van',
  12,
  true,
  true,
  true,
  ARRAY['de','en']
from transport_agency
on conflict (id) do update set
  vehicle_type = excluded.vehicle_type,
  capacity = excluded.capacity,
  supports_airport_transfer = excluded.supports_airport_transfer,
  supports_wheelchair = excluded.supports_wheelchair,
  supports_vip = excluded.supports_vip,
  languages = excluded.languages;

insert into public.transport_regions (transport_agency_id, region_id)
select transport_agency.id, r.id
from transport_agency
join public.regions r on r.country_code = 'DE' and r.region_code = 'BE'
on conflict do nothing;

-- Additional directory demo data

-- Madrid DMC
insert into public.agencies (id, type, name, slug, country_code, coverage_summary, verified, featured)
select
  coalesce((select id from public.agencies where slug = 'iberia-signature'), gen_random_uuid()),
  'dmc',
  'Iberia Signature',
  'iberia-signature',
  'ES',
  'Madrid, Toledo & Sevilla bespoke programs',
  true,
  false
on conflict (slug) do update set
  name = excluded.name,
  coverage_summary = excluded.coverage_summary,
  country_code = excluded.country_code,
  verified = excluded.verified;

-- US transport
with nyc_transport as (
  insert into public.agencies (id, type, name, slug, country_code, coverage_summary, verified, featured)
  select
    coalesce((select id from public.agencies where slug = 'hudson-exec-shuttle'), gen_random_uuid()),
    'transport',
    'Hudson Executive Shuttle',
    'hudson-exec-shuttle',
    'US',
    'Tri-state corporate shuttle fleet',
    true,
    false
  on conflict (slug) do update set
    name = excluded.name,
    coverage_summary = excluded.coverage_summary,
    country_code = excluded.country_code,
    verified = excluded.verified
  returning id
)
insert into public.transport_fleet (id, transport_agency_id, name, vehicle_type, capacity, supports_airport_transfer, supports_wheelchair, supports_vip, languages)
select
  coalesce((select id from public.transport_fleet where transport_agency_id = nyc_transport.id and name = 'Executive Vans'), gen_random_uuid()),
  nyc_transport.id,
  'Executive Vans',
  'van',
  14,
  true,
  true,
  false,
  ARRAY['en','es']
from nyc_transport
on conflict (id) do update set
  capacity = excluded.capacity,
  supports_airport_transfer = excluded.supports_airport_transfer,
  supports_wheelchair = excluded.supports_wheelchair,
  supports_vip = excluded.supports_vip,
  languages = excluded.languages;

insert into public.transport_regions (transport_agency_id, region_id)
select nyc_transport.id, r.id
from nyc_transport
join public.regions r on r.country_code = 'US' and r.region_code = 'NY'
on conflict do nothing;

-- Chicago guide
with chicago_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    coalesce((select id from auth.users where email = 'guide.chicago@guidevalidator.test'), gen_random_uuid()),
    'guide.chicago@guidevalidator.test',
    crypt('SecurePass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Jordan Ellis"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data
  returning id
), chicago_profile as (
  insert into public.profiles (id, role, full_name, locale, verified, license_verified, country_code, onboarding_completed)
  select id, 'guide', 'Jordan Ellis', 'en', true, true, 'US', true from chicago_user
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    license_verified = excluded.license_verified,
    onboarding_completed = excluded.onboarding_completed
  returning id
)
insert into public.guides (profile_id, headline, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, has_liability_insurance, response_time_minutes)
select id,
       'Architecture & culinary tours across Chicago',
       ARRAY['architecture','food','accessible'],
       ARRAY['en','es'],
       12500,
       'USD',
       12,
       true,
       30
from chicago_profile
on conflict (profile_id) do update set
  headline = excluded.headline,
  specialties = excluded.specialties,
  spoken_languages = excluded.spoken_languages,
  hourly_rate_cents = excluded.hourly_rate_cents,
  years_experience = excluded.years_experience,
  has_liability_insurance = excluded.has_liability_insurance,
  response_time_minutes = excluded.response_time_minutes;

insert into public.guide_regions (guide_id, region_id)
select chicago_profile.id, r.id
from chicago_profile
join public.regions r on r.country_code = 'US' and r.region_code = 'IL'
on conflict do nothing;
