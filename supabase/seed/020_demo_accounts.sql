-- Demo accounts and baseline data
-- Run with service role or Supabase local database connection

with super_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  select
    coalesce((select id from auth.users where email = 'superadmin@guidevalidator.test'), gen_random_uuid()),
    'superadmin@guidevalidator.test',
    crypt('SecurePass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin"}',
    'authenticated',
    'authenticated'
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data
  returning id
), super_profile as (
  insert into public.profiles (id, role, full_name, locale, verified, mfa_enabled)
  select id, 'super_admin', 'Super Admin', 'en', true, true from super_user
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    verified = excluded.verified,
    mfa_enabled = excluded.mfa_enabled
  returning id
), admin_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  select
    coalesce((select id from auth.users where email = 'admin@guidevalidator.test'), gen_random_uuid()),
    'admin@guidevalidator.test',
    crypt('SecurePass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Operator"}',
    'authenticated',
    'authenticated'
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data
  returning id
), agency_seed as (
  insert into public.agencies (id, type, name, slug, country_code, registration_number, vat_id, verified, featured)
  select
    coalesce((select id from public.agencies where slug = 'atlas-travel'), gen_random_uuid()),
    'agency',
    'Atlas Travel Group',
    'atlas-travel',
    'DE',
    'DE-AG-2025',
    'DE123456789',
    true,
    true
  on conflict (slug) do update set
    name = excluded.name,
    country_code = excluded.country_code,
    registration_number = excluded.registration_number,
    verified = excluded.verified,
    featured = excluded.featured
  returning id
), admin_profile as (
  insert into public.profiles (id, role, full_name, locale, verified, organization_id)
  select admin_user.id, 'admin', 'Admin Operator', 'en', true, (select id from agency_seed)
  from admin_user
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    organization_id = excluded.organization_id,
    verified = excluded.verified
  returning id
), agency_membership as (
  insert into public.agency_members (agency_id, profile_id, role, joined_at)
  select (select id from agency_seed), admin_profile.id, 'owner', now()
  from admin_profile
  on conflict (agency_id, profile_id) do update set
    role = excluded.role,
    joined_at = excluded.joined_at
  returning profile_id
), guide_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  select
    coalesce((select id from auth.users where email = 'guide@guidevalidator.test'), gen_random_uuid()),
    'guide@guidevalidator.test',
    crypt('SecurePass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Lina Schneider"}',
    'authenticated',
    'authenticated'
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data
  returning id
), guide_profile as (
  insert into public.profiles (id, role, full_name, locale, verified, license_verified, country_code)
  select guide_user.id, 'guide', 'Lina Schneider', 'de', true, true, 'DE'
  from guide_user
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    locale = excluded.locale,
    verified = excluded.verified,
    license_verified = excluded.license_verified,
    country_code = excluded.country_code
  returning id
), guide_details as (
  insert into public.guides (profile_id, headline, bio, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, has_liability_insurance, response_time_minutes)
  select guide_profile.id,
         'Private tours across Berlin & Potsdam',
         'Certified cultural historian offering bespoke experiences with multilingual support.',
         ARRAY['history','architecture','family-friendly'],
         ARRAY['de','en','es'],
         8500,
         'EUR',
         7,
         true,
         60
  from guide_profile
  on conflict (profile_id) do update set
    headline = excluded.headline,
    bio = excluded.bio,
    specialties = excluded.specialties,
    spoken_languages = excluded.spoken_languages,
    hourly_rate_cents = excluded.hourly_rate_cents,
    years_experience = excluded.years_experience,
    has_liability_insurance = excluded.has_liability_insurance,
    response_time_minutes = excluded.response_time_minutes
  returning profile_id
)
insert into public.guide_credentials (id, guide_id, credential_type, country_code, authority_name, license_number, issued_at, expires_at, status)
select
  coalesce(
    (select id from public.guide_credentials where guide_id = guide_details.profile_id limit 1),
    gen_random_uuid()
  ),
  guide_details.profile_id,
  'license',
  'DE',
  'IHK Berlin',
  'BER-2020-778',
  date '2020-01-01',
  date '2026-12-31',
  'approved'
from guide_details
on conflict (id) do update set
  status = excluded.status,
  expires_at = excluded.expires_at;
