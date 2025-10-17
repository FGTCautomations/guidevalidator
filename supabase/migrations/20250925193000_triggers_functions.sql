-- Ratings summary functions and availability guards
create or replace function public.refresh_guide_ratings_summary(target_guide uuid)
returns void
language plpgsql
as $$
begin
  update public.guide_ratings_summary grs
  set average_service = coalesce(agg.avg_service, 0),
      average_language = coalesce(agg.avg_language, 0),
      average_knowledge = coalesce(agg.avg_knowledge, 0),
      average_fairness = coalesce(agg.avg_fairness, 0),
      total_reviews = coalesce(agg.count_reviews, 0),
      updated_at = now()
  from (
    select
      avg(rating_service)::numeric(3,2) as avg_service,
      avg(rating_language)::numeric(3,2) as avg_language,
      avg(rating_knowledge)::numeric(3,2) as avg_knowledge,
      avg(rating_fairness)::numeric(3,2) as avg_fairness,
      count(*) as count_reviews
    from public.guide_reviews
    where guide_id = target_guide
  ) agg
  where grs.guide_id = target_guide;

  insert into public.guide_ratings_summary (guide_id, average_service, average_language, average_knowledge, average_fairness, total_reviews)
  select target_guide,
         coalesce(agg.avg_service, 0),
         coalesce(agg.avg_language, 0),
         coalesce(agg.avg_knowledge, 0),
         coalesce(agg.avg_fairness, 0),
         coalesce(agg.count_reviews, 0)
  from (
    select
      avg(rating_service)::numeric(3,2) as avg_service,
      avg(rating_language)::numeric(3,2) as avg_language,
      avg(rating_knowledge)::numeric(3,2) as avg_knowledge,
      avg(rating_fairness)::numeric(3,2) as avg_fairness,
      count(*) as count_reviews
    from public.guide_reviews
    where guide_id = target_guide
  ) agg
  where not exists (
    select 1 from public.guide_ratings_summary where guide_id = target_guide
  );
end;
$$;

create or replace function public.refresh_agency_ratings_summary(target_agency uuid)
returns void
language plpgsql
as $$
begin
  update public.agency_ratings_summary ars
  set average_payment_speed = coalesce(agg.avg_payment_speed, 0),
      average_trust = coalesce(agg.avg_trust, 0),
      average_clarity = coalesce(agg.avg_clarity, 0),
      total_reviews = coalesce(agg.count_reviews, 0),
      updated_at = now()
  from (
    select
      avg(rating_payment_speed)::numeric(3,2) as avg_payment_speed,
      avg(rating_trust)::numeric(3,2) as avg_trust,
      avg(rating_clarity)::numeric(3,2) as avg_clarity,
      count(*) as count_reviews
    from public.agency_reviews
    where agency_id = target_agency
  ) agg
  where ars.agency_id = target_agency;

  insert into public.agency_ratings_summary (agency_id, average_payment_speed, average_trust, average_clarity, total_reviews)
  select target_agency,
         coalesce(agg.avg_payment_speed, 0),
         coalesce(agg.avg_trust, 0),
         coalesce(agg.avg_clarity, 0),
         coalesce(agg.count_reviews, 0)
  from (
    select
      avg(rating_payment_speed)::numeric(3,2) as avg_payment_speed,
      avg(rating_trust)::numeric(3,2) as avg_trust,
      avg(rating_clarity)::numeric(3,2) as avg_clarity,
      count(*) as count_reviews
    from public.agency_reviews
    where agency_id = target_agency
  ) agg
  where not exists (
    select 1 from public.agency_ratings_summary where agency_id = target_agency
  );
end;
$$;

create or replace function public.refresh_transport_ratings_summary(target_transport uuid)
returns void
language plpgsql
as $$
begin
  update public.transport_ratings_summary trs
  set average_reliability = coalesce(agg.avg_reliability, 0),
      average_vehicle_quality = coalesce(agg.avg_vehicle_quality, 0),
      average_professionalism = coalesce(agg.avg_professionalism, 0),
      total_reviews = coalesce(agg.count_reviews, 0),
      updated_at = now()
  from (
    select
      avg(rating_reliability)::numeric(3,2) as avg_reliability,
      avg(rating_vehicle_quality)::numeric(3,2) as avg_vehicle_quality,
      avg(rating_professionalism)::numeric(3,2) as avg_professionalism,
      count(*) as count_reviews
    from public.transport_reviews
    where transport_agency_id = target_transport
  ) agg
  where trs.transport_agency_id = target_transport;

  insert into public.transport_ratings_summary (transport_agency_id, average_reliability, average_vehicle_quality, average_professionalism, total_reviews)
  select target_transport,
         coalesce(agg.avg_reliability, 0),
         coalesce(agg.avg_vehicle_quality, 0),
         coalesce(agg.avg_professionalism, 0),
         coalesce(agg.count_reviews, 0)
  from (
    select
      avg(rating_reliability)::numeric(3,2) as avg_reliability,
      avg(rating_vehicle_quality)::numeric(3,2) as avg_vehicle_quality,
      avg(rating_professionalism)::numeric(3,2) as avg_professionalism,
      count(*) as count_reviews
    from public.transport_reviews
    where transport_agency_id = target_transport
  ) agg
  where not exists (
    select 1 from public.transport_ratings_summary where transport_agency_id = target_transport
  );
end;
$$;

create or replace function public.trigger_refresh_guide_ratings()
returns trigger
language plpgsql
as $$
declare
  target_id uuid := coalesce(new.guide_id, old.guide_id);
begin
  perform public.refresh_guide_ratings_summary(target_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.trigger_refresh_agency_ratings()
returns trigger
language plpgsql
as $$
declare
  target_id uuid := coalesce(new.agency_id, old.agency_id);
begin
  perform public.refresh_agency_ratings_summary(target_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.trigger_refresh_transport_ratings()
returns trigger
language plpgsql
as $$
declare
  target_id uuid := coalesce(new.transport_agency_id, old.transport_agency_id);
begin
  perform public.refresh_transport_ratings_summary(target_id);
  return coalesce(new, old);
end;
$$;

create or replace trigger guide_reviews_refresh_summary
  after insert or update or delete on public.guide_reviews
  for each row execute function public.trigger_refresh_guide_ratings();

create or replace trigger agency_reviews_refresh_summary
  after insert or update or delete on public.agency_reviews
  for each row execute function public.trigger_refresh_agency_ratings();

create or replace trigger transport_reviews_refresh_summary
  after insert or update or delete on public.transport_reviews
  for each row execute function public.trigger_refresh_transport_ratings();

create or replace function public.check_availability_conflict(p_guide uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_exclude uuid default null)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.availability_slots slots
    where slots.guide_id = p_guide
      and slots.id <> coalesce(p_exclude, '00000000-0000-0000-0000-000000000000')
      and slots.ends_at > p_starts_at
      and slots.starts_at < p_ends_at
  );
$$;

create or replace function public.check_hold_conflict(p_guide uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_exclude uuid default null)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.holds h
    where h.guide_id = p_guide
      and h.id <> coalesce(p_exclude, '00000000-0000-0000-0000-000000000000')
      and h.status in ('pending','approved')
      and h.ends_at > p_starts_at
      and h.starts_at < p_ends_at
  );
$$;

create or replace function public.ensure_no_availability_conflict()
returns trigger
language plpgsql
as $$
declare
  exclude_id uuid := coalesce(old.id, new.id);
begin
  if public.check_hold_conflict(new.guide_id, new.starts_at, new.ends_at, null) then
    raise exception 'Existing hold conflicts with availability window';
  end if;
  if public.check_availability_conflict(new.guide_id, new.starts_at, new.ends_at, exclude_id) then
    raise exception 'Availability overlaps with existing slot';
  end if;
  return new;
end;
$$;

create or replace trigger availability_conflict_guard
  before insert or update on public.availability_slots
  for each row execute function public.ensure_no_availability_conflict();

create or replace function public.ensure_no_hold_conflict()
returns trigger
language plpgsql
as $$
declare
  exclude_id uuid := coalesce(old.id, new.id);
begin
  if public.check_hold_conflict(new.guide_id, new.starts_at, new.ends_at, exclude_id) then
    raise exception 'Hold overlaps with another hold';
  end if;
  if public.check_availability_conflict(new.guide_id, new.starts_at, new.ends_at, null) then
    raise exception 'Availability already booked for this window';
  end if;
  return new;
end;
$$;

create or replace trigger hold_conflict_guard
  before insert or update on public.holds
  for each row execute function public.ensure_no_hold_conflict();
