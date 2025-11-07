-- Count guides by first letter of name for approved guides
SELECT 
  UPPER(LEFT(p.full_name, 1)) as first_letter,
  COUNT(*) as guide_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%')
GROUP BY UPPER(LEFT(p.full_name, 1))
ORDER BY first_letter;
