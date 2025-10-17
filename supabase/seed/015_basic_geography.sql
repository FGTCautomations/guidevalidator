-- Minimal geography data required for seed accounts and licensing coverage
insert into public.countries (code, name)
values
  ('DE', 'Germany'),
  ('US', 'United States'),
  ('ES', 'Spain'),
  ('FR', 'France'),
  ('IT', 'Italy'),
  ('PT', 'Portugal'),
  ('JP', 'Japan'),
  ('CN', 'China'),
  ('AT', 'Austria'),
  ('GR', 'Greece')
on conflict (code) do update set
  name = excluded.name;

-- Ensure Berlin region exists for guide coverage references
with upsert as (
  insert into public.regions (id, country_code, region_code, name)
  values (
    coalesce((select id from public.regions where country_code = 'DE' and region_code = 'BE'), gen_random_uuid()),
    'DE',
    'BE',
    'Berlin'
  )
  on conflict (country_code, region_code) do update set
    name = excluded.name
  returning id
)
select id from upsert;
