-- Worker metadata and cron scheduling helpers for jobs queue
alter table public.jobs_queue
  add column if not exists priority integer not null default 5,
  add column if not exists max_attempts integer not null default 5,
  add column if not exists locked_by uuid,
  add column if not exists locked_at timestamptz,
  add column if not exists last_error text;

create table if not exists public.job_runs (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.jobs_queue(id) on delete cascade,
  attempt_number integer not null,
  worker_id uuid,
  status text not null,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.cron_tasks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  description text,
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  cron_schedule text not null,
  timezone text not null default 'UTC',
  active boolean not null default true,
  last_enqueued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

select public.ensure_trigger(
  'public',
  'cron_tasks',
  'cron_tasks_touch_updated_at',
  $SQL$
  create trigger cron_tasks_touch_updated_at
    before update on public.cron_tasks
    for each row execute function public.touch_updated_at()
  $SQL$
);
-- Helper functions
create or replace function public.claim_next_job(p_worker uuid, p_job_type text default null)
returns public.jobs_queue
language plpgsql
as $$
declare
  job_record public.jobs_queue;
begin
  with candidate as (
    select id
    from public.jobs_queue
    where status in ('pending', 'retry')
      and scheduled_for <= now()
      and (locked_at is null or locked_at < now() - interval '5 minutes')
      and (p_job_type is null or job_type = p_job_type)
    order by priority asc, scheduled_for asc, id asc
    limit 1
    for update skip locked
  )
  update public.jobs_queue jq
  set locked_by = p_worker,
      locked_at = now(),
      status = 'processing',
      attempts = jq.attempts + 1,
      last_attempt_at = now()
  where jq.id in (select id from candidate)
  returning jq.* into job_record;

  if not found then
    return null;
  end if;

  insert into public.job_runs (job_id, attempt_number, worker_id, status)
  values (job_record.id, job_record.attempts, p_worker, 'processing');

  return job_record;
end;
$$;

create or replace function public.resolve_job(p_job_id bigint, p_worker uuid, p_success boolean, p_error text default null)
returns void
language plpgsql
as $$
declare
  target public.jobs_queue;
begin
  select * into target from public.jobs_queue where id = p_job_id for update;

  if not found then
    raise exception 'Job % not found', p_job_id;
  end if;

  if target.locked_by is distinct from p_worker then
    raise exception 'Worker % cannot resolve job % locked by another worker', p_worker, p_job_id;
  end if;

  update public.jobs_queue
  set status = case
      when p_success then 'completed'
      when target.attempts >= target.max_attempts then 'failed'
      else 'retry'
    end,
    last_error = p_error,
    locked_by = null,
    locked_at = null,
    scheduled_for = case
      when p_success then scheduled_for
      else now() + interval '5 minutes'
    end
  where id = p_job_id;

  update public.job_runs
  set status = case when p_success then 'completed' else 'failed' end,
      error_message = p_error,
      finished_at = now()
  where job_id = p_job_id
    and worker_id is not distinct from p_worker
    and status = 'processing';
end;
$$;

create or replace function public.enqueue_cron_tasks()
returns integer
language plpgsql
as $$
declare
  cron_rec record;
  enqueued integer := 0;
  job_id bigint;
begin
  for cron_rec in
    select *
    from public.cron_tasks
    where active = true
      and (last_enqueued_at is null or last_enqueued_at < now() - interval '1 minute')
  loop
    insert into public.jobs_queue (job_type, payload, scheduled_for, priority, max_attempts, status)
    values (cron_rec.job_type, cron_rec.payload, now(), 5, 5, 'pending')
    returning id into job_id;

    update public.cron_tasks
    set last_enqueued_at = now(),
        updated_at = now()
    where id = cron_rec.id;

    enqueued := enqueued + 1;
  end loop;

  return enqueued;
end;
$$;

-- Enable RLS
alter table public.job_runs enable row level security;
alter table public.cron_tasks enable row level security;

drop policy if exists "job_runs_admin" on public.job_runs;
create policy "job_runs_admin" on public.job_runs
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cron_tasks_admin" on public.cron_tasks;
create policy "cron_tasks_admin" on public.cron_tasks
  for all using (public.is_admin()) with check (public.is_admin());






