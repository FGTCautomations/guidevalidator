drop policy if exists "profiles_select_directory" on public.profiles;
create policy "profiles_select_directory"
  on public.profiles
  for select
  using (
    role in ('guide', 'agency', 'dmc', 'transport')
  );
