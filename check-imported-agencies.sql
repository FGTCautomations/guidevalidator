-- Check what was imported
SELECT
    name,
    type,
    website_url,
    website,
    contact_email,
    contact_phone,
    application_data->>'english_name' as english_name,
    application_data->>'fax' as fax,
    location_data->>'headquarters_address' as address
FROM agencies
WHERE name LIKE 'Công ty TNHH%'
LIMIT 10;

-- Count agencies
SELECT COUNT(*) as total_agencies FROM agencies;

-- Check if website fields exist
SELECT
    COUNT(*) as total,
    COUNT(website_url) as has_website_url,
    COUNT(website) as has_website,
    COUNT(application_data->>'english_name') as has_english_name
FROM agencies;

-- Sample agencies with all fields
SELECT * FROM agencies LIMIT 3;
