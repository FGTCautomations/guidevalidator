insert into public.transport_fleet (id, transport_agency_id, name, vehicle_type, capacity, supports_airport_transfer, supports_wheelchair, supports_vip, languages)
select
  coalesce((select id from public.transport_fleet where name = 'Emerald Sprinters'), gen_random_uuid()),
  ag.id,
  'Emerald Sprinters',
  'van',
  12,
  true,
  true,
  false,
  ARRAY['en','de']
from public.agencies ag
where ag.slug = 'atlas-travel'
on conflict (id) do update set
  vehicle_type = excluded.vehicle_type,
  capacity = excluded.capacity,
  supports_airport_transfer = excluded.supports_airport_transfer,
  supports_wheelchair = excluded.supports_wheelchair,
  supports_vip = excluded.supports_vip,
  languages = excluded.languages;

insert into public.transport_countries (transport_agency_id, country_code)
select ag.id, 'DE'
from public.agencies ag
where ag.slug = 'atlas-travel'
on conflict do nothing;

insert into public.transport_regions (transport_agency_id, region_id)
select ag.id, r.id
from public.agencies ag
join public.regions r on r.country_code = 'DE' and r.region_code = 'BE'
where ag.slug = 'atlas-travel'
on conflict do nothing;
