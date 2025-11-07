-- Simple check to see if your token and profile exist
-- Token: VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=

-- 1. Does the token exist?
SELECT 'Step 1: Token exists' as step, COUNT(*) as result
FROM profile_claim_tokens
WHERE token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 2. Get token details
SELECT
  'Step 2: Token details' as step,
  profile_id,
  license_number,
  expires_at > NOW() as is_valid,
  claimed_at IS NULL as is_unclaimed
FROM profile_claim_tokens
WHERE token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';

-- 3. Does the profile exist? (Get profile_id from step 2 above)
-- Replace PROFILE_ID_HERE with the profile_id from step 2
SELECT
  'Step 3: Profile exists' as step,
  id,
  full_name,
  role,
  country_code
FROM profiles
WHERE id = 'PROFILE_ID_HERE'::uuid;

-- 4. OR check all at once with a join
SELECT
  'Step 4: Token + Profile joined' as step,
  pct.token,
  pct.profile_id,
  pct.license_number,
  p.id as profile_found,
  p.full_name
FROM profile_claim_tokens pct
LEFT JOIN profiles p ON p.id = pct.profile_id
WHERE pct.token = 'VQV4R8zY8l11OMPjsUB7kurIav4JDGrW2f+QU5ybHeI=';
