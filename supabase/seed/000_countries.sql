-- Usage: psql -v SEED_DIR="supabase/seed" -f supabase/seed/000_countries.sql
set search_path = public;

\copy countries (code, name)
  from :'SEED_DIR'/data/countries.csv with (format csv, header true)
  on conflict (code) do update set name = excluded.name;
