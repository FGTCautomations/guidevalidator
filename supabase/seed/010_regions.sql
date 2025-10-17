set search_path = public;

\copy regions (country_code, region_code, name)
  from :'SEED_DIR'/data/regions.csv with (format csv, header true)
  on conflict (country_code, region_code) do update set name = excluded.name;
