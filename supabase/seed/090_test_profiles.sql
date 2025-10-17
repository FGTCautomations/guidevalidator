do $$
declare
  qa_admin uuid;
  guide_user uuid;
  guide_profile uuid;
  guide_credential uuid;
  berlin_region uuid;
  agency_org uuid;
  agency_user uuid;
  agency_profile uuid;
  dmc_org uuid;
  dmc_user uuid;
  dmc_profile uuid;
  transport_org uuid;
  transport_user uuid;
  transport_profile uuid;
  transport_fleet_id uuid;
begin
  select id into berlin_region
  from public.regions
  where country_code = 'DE' and region_code = 'BE';

  if berlin_region is null then
    raise exception 'Berlin region (DE-BE) is required before loading QA profiles.';
  end if;

  -- QA admin account
  select id into qa_admin from auth.users where email = 'admin.qa@guidevalidator.test';
  if qa_admin is null then
    qa_admin := gen_random_uuid();
  end if;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    qa_admin,
    'admin.qa@guidevalidator.test',
    crypt('TestAdmin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"QA Admin"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into public.profiles (id, role, full_name, locale, verified, mfa_enabled)
  values (qa_admin, 'super_admin', 'QA Admin', 'en', true, true)
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    locale = excluded.locale,
    verified = excluded.verified,
    mfa_enabled = excluded.mfa_enabled;

  -- Test guide profile
  select id into guide_user from auth.users where email = 'test.guide@guidevalidator.test';
  if guide_user is null then
    guide_user := gen_random_uuid();
  end if;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    guide_user,
    'test.guide@guidevalidator.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Guide"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into public.profiles (id, role, full_name, locale, country_code, verified, license_verified, onboarding_completed)
  values (guide_user, 'guide', 'Test Guide', 'en', 'DE', true, true, true)
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    license_verified = excluded.license_verified,
    onboarding_completed = excluded.onboarding_completed
  returning id into guide_profile;

  insert into public.guides (profile_id, headline, bio, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, has_liability_insurance, response_time_minutes)
  values (
    guide_profile,
    'Test guide coverage for QA scenarios',
    'Seeded for regression testing of guide flows, availability, and verification states.',
    ARRAY['history','food','qa-testing'],
    ARRAY['en','de'],
    7500,
    'EUR',
    5,
    true,
    24
  )
  on conflict (profile_id) do update set
    headline = excluded.headline,
    bio = excluded.bio,
    specialties = excluded.specialties,
    spoken_languages = excluded.spoken_languages,
    hourly_rate_cents = excluded.hourly_rate_cents,
    years_experience = excluded.years_experience,
    has_liability_insurance = excluded.has_liability_insurance,
    response_time_minutes = excluded.response_time_minutes;

  select id into guide_credential
  from public.guide_credentials
  where guide_id = guide_profile
  limit 1;

  if guide_credential is null then
    guide_credential := gen_random_uuid();
  end if;

  insert into public.guide_credentials (id, guide_id, credential_type, country_code, authority_name, license_number, issued_at, expires_at, status)
  values (
    guide_credential,
    guide_profile,
    'license',
    'DE',
    'Berlin Tourism Authority',
    'TEST-GUIDE-001',
    date '2023-01-01',
    date '2027-12-31',
    'approved'
  )
  on conflict (id) do update set
    status = excluded.status,
    expires_at = excluded.expires_at;

  insert into public.guide_countries (guide_id, country_code)
  values (guide_profile, 'DE')
  on conflict do nothing;

  insert into public.guide_regions (guide_id, region_id)
  values (guide_profile, berlin_region)
  on conflict do nothing;

  -- Test travel agency profile
  select id into agency_org from public.agencies where slug = 'test-travel-agency';
  if agency_org is null then
    agency_org := gen_random_uuid();
  end if;

  insert into public.agencies (id, type, name, slug, country_code, coverage_summary, registration_number, vat_id, verified, featured, languages, specialties)

  values (

    agency_org,

    'agency',

    'Test Travel Agency',

    'test-travel-agency',

    'US',

    'QA agency seed covering North America itineraries',

    'US-AG-TEST-001',

    'US123456789',

    true,

    false,

    ARRAY['en','es'],

    ARRAY['cultural','luxury']

  )

  on conflict (id) do update set

    name = excluded.name,

    country_code = excluded.country_code,

    coverage_summary = excluded.coverage_summary,

    registration_number = excluded.registration_number,

    vat_id = excluded.vat_id,

    verified = excluded.verified,

    featured = excluded.featured,

    languages = excluded.languages,

    specialties = excluded.specialties;




  select id into agency_user from auth.users where email = 'test.agent@guidevalidator.test';
  if agency_user is null then
    agency_user := gen_random_uuid();
  end if;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    agency_user,
    'test.agent@guidevalidator.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Travel Agent"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into public.profiles (id, role, full_name, locale, country_code, verified, onboarding_completed, organization_id)
  values (agency_user, 'agency', 'Test Travel Agent', 'en', 'US', true, true, agency_org)
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    onboarding_completed = excluded.onboarding_completed,
    organization_id = excluded.organization_id
  returning id into agency_profile;

  insert into public.agency_members (agency_id, profile_id, role, joined_at)
  values (agency_org, agency_profile, 'owner', now())
  on conflict (agency_id, profile_id) do update set
    role = excluded.role;

  -- Test DMC profile
  select id into dmc_org from public.agencies where slug = 'test-dmc';
  if dmc_org is null then
    dmc_org := gen_random_uuid();
  end if;

  insert into public.agencies (id, type, name, slug, country_code, coverage_summary, registration_number, vat_id, verified, featured, languages, specialties)

  values (

    dmc_org,

    'dmc',

    'Test Destination Management',

    'test-dmc',

    'ES',

    'QA DMC seed for Iberian programs',

    'ES-DMC-TEST-001',

    'ESB1234567',

    true,

    true,

    ARRAY['en','es','pt'],

    ARRAY['luxury','mice','cultural']

  )

  on conflict (id) do update set

    name = excluded.name,

    country_code = excluded.country_code,

    coverage_summary = excluded.coverage_summary,

    registration_number = excluded.registration_number,

    vat_id = excluded.vat_id,

    verified = excluded.verified,

    featured = excluded.featured,

    languages = excluded.languages,

    specialties = excluded.specialties;



  insert into public.dmc_countries (agency_id, country_code)

  values

    (dmc_org, 'ES'),

    (dmc_org, 'PT'),

    (dmc_org, 'FR')

  on conflict do nothing;


  select id into dmc_user from auth.users where email = 'test.dmc@guidevalidator.test';
  if dmc_user is null then
    dmc_user := gen_random_uuid();
  end if;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    dmc_user,
    'test.dmc@guidevalidator.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test DMC"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into public.profiles (id, role, full_name, locale, country_code, verified, onboarding_completed, organization_id)
  values (dmc_user, 'dmc', 'Test DMC', 'en', 'ES', true, true, dmc_org)
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    onboarding_completed = excluded.onboarding_completed,
    organization_id = excluded.organization_id
  returning id into dmc_profile;

  insert into public.agency_members (agency_id, profile_id, role, joined_at)
  values (dmc_org, dmc_profile, 'owner', now())
  on conflict (agency_id, profile_id) do update set
    role = excluded.role;

  -- Test transport company profile
  select id into transport_org from public.agencies where slug = 'test-transport-co';
  if transport_org is null then
    transport_org := gen_random_uuid();
  end if;

  insert into public.agencies (id, type, name, slug, country_code, coverage_summary, registration_number, vat_id, verified, featured, languages, specialties)

  values (

    transport_org,

    'transport',

    'Test Transport Co',

    'test-transport-co',

    'DE',

    'QA transport fleet supporting Berlin and Potsdam transfers',

    'DE-TR-TEST-001',

    'DE123456789',

    true,

    false,

    ARRAY['en','de'],

    ARRAY['airport-transfer','vip','events']

  )

  on conflict (id) do update set

    name = excluded.name,

    country_code = excluded.country_code,

    coverage_summary = excluded.coverage_summary,

    registration_number = excluded.registration_number,

    vat_id = excluded.vat_id,

    verified = excluded.verified,

    featured = excluded.featured,

    languages = excluded.languages,

    specialties = excluded.specialties;



  insert into public.transport_countries (transport_agency_id, country_code)

  values (transport_org, 'DE')

  on conflict do nothing;


  select id into transport_user from auth.users where email = 'test.transport@guidevalidator.test';
  if transport_user is null then
    transport_user := gen_random_uuid();
  end if;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    transport_user,
    'test.transport@guidevalidator.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Transport"}',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into public.profiles (id, role, full_name, locale, country_code, verified, onboarding_completed, organization_id)
  values (transport_user, 'transport', 'Test Transport', 'en', 'DE', true, true, transport_org)
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    country_code = excluded.country_code,
    verified = excluded.verified,
    onboarding_completed = excluded.onboarding_completed,
    organization_id = excluded.organization_id
  returning id into transport_profile;

  insert into public.agency_members (agency_id, profile_id, role, joined_at)
  values (transport_org, transport_profile, 'owner', now())
  on conflict (agency_id, profile_id) do update set
    role = excluded.role;

  select id into transport_fleet_id
  from public.transport_fleet
  where transport_agency_id = transport_org and name = 'QA Sprinter Fleet'
  limit 1;

  if transport_fleet_id is null then
    transport_fleet_id := gen_random_uuid();
  end if;

  insert into public.transport_fleet (id, transport_agency_id, name, vehicle_type, capacity, supports_airport_transfer, supports_wheelchair, supports_vip, languages)
  values (
    transport_fleet_id,
    transport_org,
    'QA Sprinter Fleet',
    'van',
    10,
    true,
    true,
    true,
    ARRAY['en','de']
  )
  on conflict (id) do update set
    vehicle_type = excluded.vehicle_type,
    capacity = excluded.capacity,
    supports_airport_transfer = excluded.supports_airport_transfer,
    supports_wheelchair = excluded.supports_wheelchair,
    supports_vip = excluded.supports_vip,
    languages = excluded.languages;

  insert into public.transport_regions (transport_agency_id, region_id)
  values (transport_org, berlin_region)
  on conflict do nothing;
end;
$$;


