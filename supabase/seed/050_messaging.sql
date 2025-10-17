with convo as (
  insert into public.conversations (id, subject, created_by)
  select
    coalesce((select id from public.conversations where subject = 'Welcome to Guide Validator' limit 1), gen_random_uuid()),
    'Welcome to Guide Validator',
    (select id from public.profiles where role = 'admin' limit 1)
  on conflict (id) do update set subject = excluded.subject
  returning id
), participants as (
  insert into public.conversation_participants (conversation_id, profile_id, role)
  select c.id, p.id, case when p.role = 'admin' then 'owner' else 'member' end
  from convo c
  join public.profiles p on p.role in ('admin','guide')
  on conflict (conversation_id, profile_id) do nothing
  returning conversation_id
)
insert into public.messages (conversation_id, sender_id, body)
select
  (select conversation_id from participants limit 1),
  (select id from public.profiles where role = 'admin' limit 1),
  'Welcome aboard! Share availability so we can feature your profile.'
where not exists (
  select 1 from public.messages m
  join convo c on c.id = m.conversation_id
);
