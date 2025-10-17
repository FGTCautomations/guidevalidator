drop policy if exists "profiles_select_directory" on public.profiles;
create policy "profiles_select_directory"
  on public.profiles
  for select
  using (
    role in ('guide', 'agency', 'dmc', 'transport')
    and verified = true
  );

drop policy if exists "cities_select_public" on public.cities;
create policy "cities_select_public"
  on public.cities
  for select
  using (true);
