-- Stripe billing scaffolding
create table if not exists public.billing_plans (
  plan_code text primary key,
  stripe_product_id text,
  stripe_price_id text unique,
  amount_cents integer not null,
  currency char(3) not null default 'EUR',
  interval text not null check (interval in ('one_time','month','year')),
  interval_count smallint not null default 1,
  description text,
  target_role text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

select public.ensure_trigger(
  'public',
  'billing_plans',
  'billing_plans_touch_updated_at',
  $SQL$
  create trigger billing_plans_touch_updated_at
    before update on public.billing_plans
    for each row execute function public.touch_updated_at()
  $SQL$
);
create unique index if not exists billing_plans_stripe_price_uidx
  on public.billing_plans (stripe_price_id);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  stripe_customer_id text not null unique,
  organization_id uuid references public.agencies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_owner_chk check (
    (case when organization_id is not null then 1 else 0 end) +
    (case when profile_id is not null then 1 else 0 end) = 1
  )
);

select public.ensure_trigger(
  'public',
  'billing_customers',
  'billing_customers_touch_updated_at',
  $SQL$
  create trigger billing_customers_touch_updated_at
    before update on public.billing_customers
    for each row execute function public.touch_updated_at()
  $SQL$
);
create index if not exists billing_customers_org_idx
  on public.billing_customers (organization_id);

create index if not exists billing_customers_profile_idx
  on public.billing_customers (profile_id);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_plan_code_fkey'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_plan_code_fkey
      foreign key (plan_code) references public.billing_plans(plan_code);
  end if;
end;
$$;

alter table public.subscriptions
  add column if not exists billing_customer_id uuid references public.billing_customers(id) on delete set null;

create index if not exists subscriptions_billing_customer_idx
  on public.subscriptions (billing_customer_id);

do $$
begin
  if not exists (
    select 1
    from pg_attribute
    where attrelid = 'public.payments'::regclass
      and attname = 'billing_customer_id'
  ) then
    alter table public.payments
      add column billing_customer_id uuid references public.billing_customers(id) on delete set null;
  end if;
end;
$$;

alter table public.payments
  add column if not exists plan_code text;

create index if not exists payments_billing_customer_idx
  on public.payments (billing_customer_id);

create index if not exists payments_plan_code_idx
  on public.payments (plan_code);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_plan_code_fkey'
  ) then
    alter table public.payments
      add constraint payments_plan_code_fkey
      foreign key (plan_code) references public.billing_plans(plan_code);
  end if;
end;
$$;

alter table public.billing_plans enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_events enable row level security;

create or replace function public.is_billing_customer_owner(customer uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.billing_customers bc
      left join public.agency_members am
        on bc.organization_id = am.agency_id
        and am.removed_at is null
      where bc.id = customer
        and (
          (bc.organization_id is not null and am.profile_id = auth.uid())
          or (bc.profile_id = auth.uid())
        )
    ), false
  ) or public.is_admin();
$$;

drop policy if exists "billing_customers_select" on public.billing_customers;
create policy "billing_customers_select" on public.billing_customers
  for select using (
    public.is_billing_customer_owner(id)
  );

drop policy if exists "billing_customers_manage" on public.billing_customers;
create policy "billing_customers_manage" on public.billing_customers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "billing_plans_select" on public.billing_plans;
create policy "billing_plans_select" on public.billing_plans
  for select using (true);

drop policy if exists "billing_plans_manage" on public.billing_plans;
create policy "billing_plans_manage" on public.billing_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "billing_events_admin" on public.billing_events;
create policy "billing_events_admin" on public.billing_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select using (
    public.is_subscription_owner(subscription_id)
    or (billing_customer_id is not null and public.is_billing_customer_owner(billing_customer_id))
    or exists (
      select 1
      from public.agency_members am
      where am.agency_id = organization_id
        and am.profile_id = auth.uid()
        and am.removed_at is null
    )
    or public.is_admin()
  );

