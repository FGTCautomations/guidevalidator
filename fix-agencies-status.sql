-- Change all imported agencies from 'approved' to 'pending'
UPDATE agencies
SET
    application_status = 'pending',
    verified = false,
    updated_at = NOW()
WHERE application_status = 'approved'
  AND country_code = 'VN';

-- Verify the change
SELECT
    application_status,
    verified,
    COUNT(*) as count
FROM agencies
GROUP BY application_status, verified;

-- Sample
SELECT name, application_status, verified FROM agencies LIMIT 5;
