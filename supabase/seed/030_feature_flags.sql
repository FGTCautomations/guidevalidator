insert into public.feature_flags (key, description, enabled, rollout)
values
  ('directory.newFilters', 'Enable advanced filter UI in directory', true, '{"percentage":100}'),
  ('chat.attachments', 'Allow file attachments in chat', false, '{"percentage":0}'),
  ('jobs.matching', 'Enable auto-matching suggestions for jobs', false, '{"percentage":0}');
