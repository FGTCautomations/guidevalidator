-- GuideValidator Ads System Migration (Clean Install)
-- Implements brand-safe, admin-managed advertising with conditional rendering
-- This version safely handles existing tables and policies

-- Drop existing policies if they exist
drop policy if exists "ads_read_public" on ads;
drop policy if exists "ads_crud_admin" on ads;
drop policy if exists "ads_insert_admin" on ads;
drop policy if exists "ads_update_admin" on ads;
drop policy if exists "ads_delete_admin" on ads;
drop policy if exists "sponsored_listings_read_public" on sponsored_listings;
drop policy if exists "sponsored_listings_crud_admin" on sponsored_listings;
drop policy if exists "sponsored_listings_insert_admin" on sponsored_listings;
drop policy if exists "sponsored_listings_update_admin" on sponsored_listings;
drop policy if exists "sponsored_listings_delete_admin" on sponsored_listings;
drop policy if exists "ad_clicks_insert_public" on ad_clicks;
drop policy if exists "ad_clicks_read_admin" on ad_clicks;

-- Drop existing function if exists
drop function if exists select_ad(text, text, text);

-- Drop existing trigger if exists (but keep the function as it's shared)
drop trigger if exists update_ads_updated_at on ads;

-- Drop existing indexes if they exist
drop index if exists idx_ads_placement;
drop index if exists idx_ads_active_schedule;
drop index if exists idx_ads_country_filter;
drop index if exists idx_sponsored_listings_context;
drop index if exists idx_ad_clicks_ad_id;

-- Ads table
create table if not exists ads (
  id bigint generated always as identity primary key,
  advertiser_name text not null,
  ad_type text not null check (ad_type in ('banner', 'native_card', 'partner_tile')),
  placement text[] not null, -- e.g. '{homepage_mid, listings, sidebar, footer}'
  target_url text,
  image_url text,            -- for banner/tile
  headline text,             -- for native/tile
  description text,          -- optional
  cta_label text default 'Learn more',
  country_filter text[],     -- ISO2 codes; null/empty = global
  keywords text[],           -- optional
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_active boolean not null default true,
  weight int not null default 1, -- simple rotation weight
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sponsored placements for listings (optional granularity)
create table if not exists sponsored_listings (
  id bigint generated always as identity primary key,
  ad_id bigint references ads(id) on delete cascade,
  list_context text not null, -- e.g. 'guides', 'dmcs', 'transport'
  insert_after int not null default 3 -- position in list
);

-- Basic click tracking (optional; can expand later)
create table if not exists ad_clicks (
  id bigint generated always as identity primary key,
  ad_id bigint references ads(id) on delete cascade,
  clicked_at timestamptz default now(),
  country text,
  page text,
  ip inet
);

-- Enable RLS
alter table ads enable row level security;
alter table sponsored_listings enable row level security;
alter table ad_clicks enable row level security;

-- Policies for ads (public can read active ads)
create policy "ads_read_public"
  on ads for select
  using (is_active = true);

create policy "ads_insert_admin"
  on ads for insert
  to authenticated
  with check (true);

create policy "ads_update_admin"
  on ads for update
  to authenticated
  using (true)
  with check (true);

create policy "ads_delete_admin"
  on ads for delete
  to authenticated
  using (true);

-- Policies for sponsored_listings
create policy "sponsored_listings_read_public"
  on sponsored_listings for select
  using (true);

create policy "sponsored_listings_insert_admin"
  on sponsored_listings for insert
  to authenticated
  with check (true);

create policy "sponsored_listings_update_admin"
  on sponsored_listings for update
  to authenticated
  using (true)
  with check (true);

create policy "sponsored_listings_delete_admin"
  on sponsored_listings for delete
  to authenticated
  using (true);

-- Policies for ad_clicks (anyone can insert clicks)
create policy "ad_clicks_insert_public"
  on ad_clicks for insert
  with check (true);

create policy "ad_clicks_read_admin"
  on ad_clicks for select
  to authenticated
  using (true);

-- Create indexes for performance
create index if not exists idx_ads_placement on ads using gin(placement);
create index if not exists idx_ads_active_schedule on ads(is_active, start_at, end_at);
create index if not exists idx_ads_country_filter on ads using gin(country_filter);
create index if not exists idx_sponsored_listings_context on sponsored_listings(list_context);
create index if not exists idx_ad_clicks_ad_id on ad_clicks(ad_id);

-- Update trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_ads_updated_at
  before update on ads
  for each row
  execute function update_updated_at_column();

-- RPC function for weighted ad selection
create or replace function select_ad(
  p_placement text,
  p_country text default null,
  p_list_context text default null
)
returns table(
  id bigint,
  advertiser_name text,
  ad_type text,
  placement text[],
  target_url text,
  image_url text,
  headline text,
  description text,
  cta_label text,
  weight int
) as $$
declare
  v_total_weight int;
  v_random_weight int;
  v_cumulative_weight int := 0;
begin
  -- Get total weight of matching ads
  select coalesce(sum(ads.weight), 0)
  into v_total_weight
  from ads
  where ads.is_active = true
    and now() between ads.start_at and ads.end_at
    and ads.placement @> array[p_placement]
    and (ads.country_filter is null or array_length(ads.country_filter, 1) is null or p_country = any(ads.country_filter));

  -- If no ads match, return empty
  if v_total_weight = 0 then
    return;
  end if;

  -- Generate random weight
  v_random_weight := floor(random() * v_total_weight)::int;

  -- Select ad using weighted random
  return query
  with matching_ads as (
    select
      ads.id,
      ads.advertiser_name,
      ads.ad_type,
      ads.placement,
      ads.target_url,
      ads.image_url,
      ads.headline,
      ads.description,
      ads.cta_label,
      ads.weight
    from ads
    where ads.is_active = true
      and now() between ads.start_at and ads.end_at
      and ads.placement @> array[p_placement]
      and (ads.country_filter is null or array_length(ads.country_filter, 1) is null or p_country = any(ads.country_filter))
    order by ads.id
  )
  select *
  from matching_ads
  limit 1
  offset (
    select count(*)
    from matching_ads m1
    cross join matching_ads m2
    where m2.id <= m1.id
    having sum(m2.weight) > v_random_weight
    limit 1
    offset 0
  );
end;
$$ language plpgsql security definer;

comment on table ads is 'Brand-safe advertising system for GuideValidator';
comment on table sponsored_listings is 'Configuration for sponsored card placements in listings';
comment on table ad_clicks is 'Click tracking for ads (minimal logging)';
comment on function select_ad is 'Weighted random ad selection based on placement and targeting criteria';
