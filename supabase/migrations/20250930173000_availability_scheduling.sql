-- Availability slots for guides and transport providers
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  owner_role text not null check (owner_role in ('guide','transport')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'available' check (status in ('available','blocked','unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_valid_range check (ends_at > starts_at)
);

create index if not exists availability_slots_owner_idx on public.availability_slots(owner_id, owner_role);
create index if not exists availability_slots_time_idx on public.availability_slots(owner_id, starts_at, ends_at);

select public.ensure_trigger(
  'public',
  'availability_slots',
  'availability_slots_touch_updated_at',
  $SQL$
    create trigger availability_slots_touch_updated_at
      before update on public.availability_slots
      for each row execute function public.touch_updated_at()
  $SQL$
);

alter table public.availability_slots enable row level security;

create policy "availability_slots_select_public" on public.availability_slots
  for select using (true);

create policy "availability_slots_manage_owner" on public.availability_slots
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Booking requests placed by agencies/DMCs to guides/transport
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requester_role text not null check (requester_role in ('agency','dmc')),
  target_id uuid not null references public.profiles(id) on delete cascade,
  target_role text not null check (target_role in ('guide','transport')),
  job_id uuid references public.jobs(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_requests_valid_range check (ends_at > starts_at)
);

create index if not exists booking_requests_target_idx on public.booking_requests(target_id, target_role, status);
create index if not exists booking_requests_requester_idx on public.booking_requests(requester_id, requester_role);
create index if not exists booking_requests_time_idx on public.booking_requests(target_id, starts_at, ends_at, status);

select public.ensure_trigger(
  'public',
  'booking_requests',
  'booking_requests_touch_updated_at',
  $SQL$
    create trigger booking_requests_touch_updated_at
      before update on public.booking_requests
      for each row execute function public.touch_updated_at()
  $SQL$
);

alter table public.booking_requests enable row level security;

create policy "booking_requests_participants_select" on public.booking_requests
  for select using (
    requester_id = auth.uid()
    or target_id = auth.uid()
    or public.is_admin()
  );

create policy "booking_requests_insert_requester" on public.booking_requests
  for insert with check (
    requester_id = auth.uid()
    and requester_role in ('agency','dmc')
  );

create policy "booking_requests_update_target" on public.booking_requests
  for update using (
    target_id = auth.uid()
    or requester_id = auth.uid()
    or public.is_admin()
  ) with check (true);
