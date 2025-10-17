insert into public.guide_reviews (id, guide_id, reviewer_agency_id, reviewer_profile_id, rating_service, rating_language, rating_knowledge, rating_fairness, comment)
select
  coalesce((select id from public.guide_reviews where reviewer_profile_id = admin_profile.id limit 1), gen_random_uuid()),
  guide_profile.id,
  agency.id,
  admin_profile.id,
  5,
  5,
  5,
  4,
  'Excellent guest feedback—super prepared and punctual.'
from public.profiles guide_profile
join public.guides g on g.profile_id = guide_profile.id
join public.profiles admin_profile on admin_profile.role = 'admin'
join public.agencies agency on agency.id = admin_profile.organization_id
where guide_profile.role = 'guide'
on conflict (id) do update set
  rating_service = excluded.rating_service,
  rating_language = excluded.rating_language,
  rating_knowledge = excluded.rating_knowledge,
  rating_fairness = excluded.rating_fairness,
  comment = excluded.comment;

insert into public.agency_reviews (id, agency_id, reviewer_guide_id, reviewer_profile_id, rating_payment_speed, rating_trust, rating_clarity, comment)
select
  coalesce((select id from public.agency_reviews where reviewer_profile_id = guide_profile.id limit 1), gen_random_uuid()),
  agency.id,
  guide_profile.id,
  guide_profile.id,
  5,
  5,
  4,
  'Smooth communication and timely payments.'
from public.profiles guide_profile
join public.guides g on g.profile_id = guide_profile.id
join public.agencies agency on agency.slug = 'atlas-travel'
where guide_profile.role = 'guide'
on conflict (id) do update set
  rating_payment_speed = excluded.rating_payment_speed,
  rating_trust = excluded.rating_trust,
  rating_clarity = excluded.rating_clarity,
  comment = excluded.comment;
