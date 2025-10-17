-- Job responses allow guides, transport companies and DMCs to respond to open jobs.
create table if not exists public.job_responses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  responder_id uuid not null references public.profiles(id) on delete cascade,
  responder_role text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists job_responses_job_id_idx on public.job_responses(job_id);
create index if not exists job_responses_responder_id_idx on public.job_responses(responder_id);

alter table public.job_responses enable row level security;

create policy "job_responses_insert_self" on public.job_responses
  for insert with check (responder_id = auth.uid());

create policy "job_responses_select_owner_or_self" on public.job_responses
  for select using (
    responder_id = auth.uid()
    or public.is_job_owner(job_id)
    or public.is_admin()
  );
