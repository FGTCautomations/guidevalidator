-- Additional fields to capture richer onboarding details per role
alter table public.agency_applications
  add column if not exists logo_url text,
  add column if not exists proof_of_activity_url text,
  add column if not exists representative_id_document_url text;

alter table public.guide_applications
  add column if not exists profile_photo_url text;

alter table public.dmc_applications
  add column if not exists logo_url text,
  add column if not exists website_url text,
  add column if not exists company_overview text;

alter table public.transport_applications
  add column if not exists logo_url text,
  add column if not exists website_url text,
  add column if not exists short_description text;

