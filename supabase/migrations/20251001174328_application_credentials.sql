-- Add stored credential fields for pending applications
alter table public.guide_applications
  add column if not exists login_email text,
  add column if not exists login_password_ciphertext text,
  add column if not exists login_password_iv text,
  add column if not exists login_password_tag text;

alter table public.agency_applications
  add column if not exists login_email text,
  add column if not exists login_password_ciphertext text,
  add column if not exists login_password_iv text,
  add column if not exists login_password_tag text;

alter table public.dmc_applications
  add column if not exists login_email text,
  add column if not exists login_password_ciphertext text,
  add column if not exists login_password_iv text,
  add column if not exists login_password_tag text;

alter table public.transport_applications
  add column if not exists login_email text,
  add column if not exists login_password_ciphertext text,
  add column if not exists login_password_iv text,
  add column if not exists login_password_tag text;
