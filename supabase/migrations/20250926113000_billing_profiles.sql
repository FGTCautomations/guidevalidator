-- Allow subscriptions and payments to belong to either organizations or individual profiles
alter table public.subscriptions
  alter column organization_id drop not null;

alter table public.subscriptions
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

alter table public.subscriptions
  drop constraint if exists subscriptions_owner_chk;

alter table public.subscriptions
  add constraint subscriptions_owner_chk check (
    (case when organization_id is not null then 1 else 0 end) +
    (case when profile_id is not null then 1 else 0 end) = 1
  );

create index if not exists subscriptions_profile_idx
  on public.subscriptions (profile_id);

create unique index if not exists subscriptions_stripe_id_uidx
  on public.subscriptions (stripe_subscription_id);

create or replace function public.is_subscription_owner(subscription uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.subscriptions s
      left join public.agency_members am
        on s.organization_id = am.agency_id
        and am.removed_at is null
      where s.id = subscription
        and (
          (s.profile_id is not null and s.profile_id = auth.uid())
          or (s.organization_id is not null and am.profile_id = auth.uid())
        )
    ), false
  ) or public.is_admin();
$$;

alter table public.payments
  alter column organization_id drop not null;

alter table public.payments
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

alter table public.payments
  drop constraint if exists payments_owner_chk;

alter table public.payments
  add constraint payments_owner_chk check (
    (case when organization_id is not null then 1 else 0 end) +
    (case when profile_id is not null then 1 else 0 end) = 1
  );

create index if not exists payments_profile_idx
  on public.payments (profile_id);

alter table public.payments
  add column if not exists stripe_invoice_id text;

create unique index if not exists payments_stripe_invoice_uidx
  on public.payments (stripe_invoice_id)
  where stripe_invoice_id is not null;

create unique index if not exists payments_stripe_intent_uidx
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- Refresh policies so profile owners can see their own billing entries

drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select using (
    public.is_subscription_owner(subscription_id)
    or (profile_id is not null and profile_id = auth.uid())
    or exists (
      select 1
      from public.agency_members am
      where am.agency_id = organization_id
        and am.profile_id = auth.uid()
        and am.removed_at is null
    )
    or (billing_customer_id is not null and public.is_billing_customer_owner(billing_customer_id))
    or public.is_admin()
  );

