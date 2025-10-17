# Worker Operations Runbook

## Overview
Guide Validator uses the `jobs_queue` table to orchestrate background work (OCR, license renewals, moderation, etc.). Jobs are created by server actions, cron tasks, or seeds.

## Workers
- Workers authenticate with the Supabase service role key (environment variable `SUPABASE_SERVICE_ROLE_KEY`).
- The helper functions `claim_next_job(worker_id uuid, job_type text)` and `resolve_job(job_id bigint, worker_id uuid, success boolean, error text)` coordinate locking and retries.
- Workers should:
  1. Call `claim_next_job` with a unique worker UUID per instance.
  2. Process the payload returned in `payload` column.
  3. Call `resolve_job` with `success = true` on completion or `false` with `error` message on failure.
  4. Respect `max_attempts` and let the database handle retry backoff (5 minutes by default).

## Cron Scheduling
- `cron_tasks` stores definitions for recurring jobs. Supabase cron (or an external scheduler) should execute a function/edge endpoint that runs `select enqueue_cron_tasks();` at least once per minute.
- Each enqueue updates `last_enqueued_at` to prevent duplicate scheduling within the same minute.

## Error Handling
- Failed jobs with `status = 'failed'` should trigger alerting (e.g., Logflare/Sentry). Consider a periodic task that checks for failed jobs older than 10 minutes.
- `job_runs` records each attempt; use this for audit dashboards.

## Security
- Never embed service role keys in client code. Only backend workers or Supabase Edge Functions should use them.
- Rotate the service role key if leaked. Update all worker environments when rotating.

## Deployment Checklist
1. Ensure migrations through `20250925195500_jobs_workers.sql` are applied.
2. Configure environment variables (`SUPABASE_SERVICE_ROLE_KEY`, worker-specific secrets).
3. Deploy worker (Supabase Edge Function, Cloud Run, or similar) with polling loop.
4. Schedule `enqueue_cron_tasks` (Edge scheduler or external cron).
5. Monitor logs for failed jobs and update runbook as new job types are added.
