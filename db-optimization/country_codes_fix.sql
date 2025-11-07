-- ============================================================================
-- COUNTRY CODE STANDARDIZATION (ISO3 -> ISO2)
-- Purpose: Convert all country code columns from ISO3 (char(3)) to ISO2 (char(2))
-- Platform: Supabase (Postgres 15)
-- Status: PROPOSAL - Review and test before applying
-- ============================================================================

-- BACKGROUND:
-- Guide Validator uses ISO2 country codes (US, GB, FR) in countries table
-- Some FK columns may have been created as char(3) or varchar(3) expecting ISO3
-- This script standardizes all to ISO2 for consistency

\timing on
\echo '\n=== COUNTRY CODE STANDARDIZATION PLAN ===\n'

-- ============================================================================
-- PHASE 1: CREATE ISO MAPPING TABLE
-- ============================================================================

\echo 'PHASE 1: Creating ISO country code mapping table\n'

-- This table holds both ISO2 and ISO3 codes for conversion
CREATE TABLE IF NOT EXISTS iso_country_codes (
    iso2 char(2) PRIMARY KEY,
    iso3 char(3) UNIQUE NOT NULL,
    name_en text NOT NULL,
    name_official text,
    numeric_code char(3),
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE iso_country_codes IS 'ISO 3166-1 country code mappings for conversion';

-- ============================================================================
-- PHASE 2: LOAD ISO DATA
-- ============================================================================

\echo 'PHASE 2: Loading ISO country codes\n'

-- Insert common country codes
-- Full list: https://en.wikipedia.org/wiki/ISO_3166-1
INSERT INTO iso_country_codes (iso2, iso3, name_en, numeric_code) VALUES
('AF', 'AFG', 'Afghanistan', '004'),
('AL', 'ALB', 'Albania', '008'),
('DZ', 'DZA', 'Algeria', '012'),
('AD', 'AND', 'Andorra', '020'),
('AO', 'AGO', 'Angola', '024'),
('AR', 'ARG', 'Argentina', '032'),
('AM', 'ARM', 'Armenia', '051'),
('AU', 'AUS', 'Australia', '036'),
('AT', 'AUT', 'Austria', '040'),
('AZ', 'AZE', 'Azerbaijan', '031'),
('BS', 'BHS', 'Bahamas', '044'),
('BH', 'BHR', 'Bahrain', '048'),
('BD', 'BGD', 'Bangladesh', '050'),
('BB', 'BRB', 'Barbados', '052'),
('BY', 'BLR', 'Belarus', '112'),
('BE', 'BEL', 'Belgium', '056'),
('BZ', 'BLZ', 'Belize', '084'),
('BJ', 'BEN', 'Benin', '204'),
('BT', 'BTN', 'Bhutan', '064'),
('BO', 'BOL', 'Bolivia', '068'),
('BA', 'BIH', 'Bosnia and Herzegovina', '070'),
('BW', 'BWA', 'Botswana', '072'),
('BR', 'BRA', 'Brazil', '076'),
('BN', 'BRN', 'Brunei', '096'),
('BG', 'BGR', 'Bulgaria', '100'),
('BF', 'BFA', 'Burkina Faso', '854'),
('BI', 'BDI', 'Burundi', '108'),
('KH', 'KHM', 'Cambodia', '116'),
('CM', 'CMR', 'Cameroon', '120'),
('CA', 'CAN', 'Canada', '124'),
('CV', 'CPV', 'Cape Verde', '132'),
('CF', 'CAF', 'Central African Republic', '140'),
('TD', 'TCD', 'Chad', '148'),
('CL', 'CHL', 'Chile', '152'),
('CN', 'CHN', 'China', '156'),
('CO', 'COL', 'Colombia', '170'),
('KM', 'COM', 'Comoros', '174'),
('CG', 'COG', 'Congo', '178'),
('CD', 'COD', 'Congo, Democratic Republic', '180'),
('CR', 'CRI', 'Costa Rica', '188'),
('HR', 'HRV', 'Croatia', '191'),
('CU', 'CUB', 'Cuba', '192'),
('CY', 'CYP', 'Cyprus', '196'),
('CZ', 'CZE', 'Czech Republic', '203'),
('DK', 'DNK', 'Denmark', '208'),
('DJ', 'DJI', 'Djibouti', '262'),
('DM', 'DMA', 'Dominica', '212'),
('DO', 'DOM', 'Dominican Republic', '214'),
('EC', 'ECU', 'Ecuador', '218'),
('EG', 'EGY', 'Egypt', '818'),
('SV', 'SLV', 'El Salvador', '222'),
('GQ', 'GNQ', 'Equatorial Guinea', '226'),
('ER', 'ERI', 'Eritrea', '232'),
('EE', 'EST', 'Estonia', '233'),
('ET', 'ETH', 'Ethiopia', '231'),
('FJ', 'FJI', 'Fiji', '242'),
('FI', 'FIN', 'Finland', '246'),
('FR', 'FRA', 'France', '250'),
('GA', 'GAB', 'Gabon', '266'),
('GM', 'GMB', 'Gambia', '270'),
('GE', 'GEO', 'Georgia', '268'),
('DE', 'DEU', 'Germany', '276'),
('GH', 'GHA', 'Ghana', '288'),
('GR', 'GRC', 'Greece', '300'),
('GD', 'GRD', 'Grenada', '308'),
('GT', 'GTM', 'Guatemala', '320'),
('GN', 'GIN', 'Guinea', '324'),
('GW', 'GNB', 'Guinea-Bissau', '624'),
('GY', 'GUY', 'Guyana', '328'),
('HT', 'HTI', 'Haiti', '332'),
('HN', 'HND', 'Honduras', '340'),
('HU', 'HUN', 'Hungary', '348'),
('IS', 'ISL', 'Iceland', '352'),
('IN', 'IND', 'India', '356'),
('ID', 'IDN', 'Indonesia', '360'),
('IR', 'IRN', 'Iran', '364'),
('IQ', 'IRQ', 'Iraq', '368'),
('IE', 'IRL', 'Ireland', '372'),
('IL', 'ISR', 'Israel', '376'),
('IT', 'ITA', 'Italy', '380'),
('JM', 'JAM', 'Jamaica', '388'),
('JP', 'JPN', 'Japan', '392'),
('JO', 'JOR', 'Jordan', '400'),
('KZ', 'KAZ', 'Kazakhstan', '398'),
('KE', 'KEN', 'Kenya', '404'),
('KI', 'KIR', 'Kiribati', '296'),
('KP', 'PRK', 'North Korea', '408'),
('KR', 'KOR', 'South Korea', '410'),
('KW', 'KWT', 'Kuwait', '414'),
('KG', 'KGZ', 'Kyrgyzstan', '417'),
('LA', 'LAO', 'Laos', '418'),
('LV', 'LVA', 'Latvia', '428'),
('LB', 'LBN', 'Lebanon', '422'),
('LS', 'LSO', 'Lesotho', '426'),
('LR', 'LBR', 'Liberia', '430'),
('LY', 'LBY', 'Libya', '434'),
('LI', 'LIE', 'Liechtenstein', '438'),
('LT', 'LTU', 'Lithuania', '440'),
('LU', 'LUX', 'Luxembourg', '442'),
('MG', 'MDG', 'Madagascar', '450'),
('MW', 'MWI', 'Malawi', '454'),
('MY', 'MYS', 'Malaysia', '458'),
('MV', 'MDV', 'Maldives', '462'),
('ML', 'MLI', 'Mali', '466'),
('MT', 'MLT', 'Malta', '470'),
('MH', 'MHL', 'Marshall Islands', '584'),
('MR', 'MRT', 'Mauritania', '478'),
('MU', 'MUS', 'Mauritius', '480'),
('MX', 'MEX', 'Mexico', '484'),
('FM', 'FSM', 'Micronesia', '583'),
('MD', 'MDA', 'Moldova', '498'),
('MC', 'MCO', 'Monaco', '492'),
('MN', 'MNG', 'Mongolia', '496'),
('ME', 'MNE', 'Montenegro', '499'),
('MA', 'MAR', 'Morocco', '504'),
('MZ', 'MOZ', 'Mozambique', '508'),
('MM', 'MMR', 'Myanmar', '104'),
('NA', 'NAM', 'Namibia', '516'),
('NR', 'NRU', 'Nauru', '520'),
('NP', 'NPL', 'Nepal', '524'),
('NL', 'NLD', 'Netherlands', '528'),
('NZ', 'NZL', 'New Zealand', '554'),
('NI', 'NIC', 'Nicaragua', '558'),
('NE', 'NER', 'Niger', '562'),
('NG', 'NGA', 'Nigeria', '566'),
('NO', 'NOR', 'Norway', '578'),
('OM', 'OMN', 'Oman', '512'),
('PK', 'PAK', 'Pakistan', '586'),
('PW', 'PLW', 'Palau', '585'),
('PA', 'PAN', 'Panama', '591'),
('PG', 'PNG', 'Papua New Guinea', '598'),
('PY', 'PRY', 'Paraguay', '600'),
('PE', 'PER', 'Peru', '604'),
('PH', 'PHL', 'Philippines', '608'),
('PL', 'POL', 'Poland', '616'),
('PT', 'PRT', 'Portugal', '620'),
('QA', 'QAT', 'Qatar', '634'),
('RO', 'ROU', 'Romania', '642'),
('RU', 'RUS', 'Russia', '643'),
('RW', 'RWA', 'Rwanda', '646'),
('KN', 'KNA', 'Saint Kitts and Nevis', '659'),
('LC', 'LCA', 'Saint Lucia', '662'),
('VC', 'VCT', 'Saint Vincent and the Grenadines', '670'),
('WS', 'WSM', 'Samoa', '882'),
('SM', 'SMR', 'San Marino', '674'),
('ST', 'STP', 'Sao Tome and Principe', '678'),
('SA', 'SAU', 'Saudi Arabia', '682'),
('SN', 'SEN', 'Senegal', '686'),
('RS', 'SRB', 'Serbia', '688'),
('SC', 'SYC', 'Seychelles', '690'),
('SL', 'SLE', 'Sierra Leone', '694'),
('SG', 'SGP', 'Singapore', '702'),
('SK', 'SVK', 'Slovakia', '703'),
('SI', 'SVN', 'Slovenia', '705'),
('SB', 'SLB', 'Solomon Islands', '090'),
('SO', 'SOM', 'Somalia', '706'),
('ZA', 'ZAF', 'South Africa', '710'),
('SS', 'SSD', 'South Sudan', '728'),
('ES', 'ESP', 'Spain', '724'),
('LK', 'LKA', 'Sri Lanka', '144'),
('SD', 'SDN', 'Sudan', '729'),
('SR', 'SUR', 'Suriname', '740'),
('SZ', 'SWZ', 'Eswatini', '748'),
('SE', 'SWE', 'Sweden', '752'),
('CH', 'CHE', 'Switzerland', '756'),
('SY', 'SYR', 'Syria', '760'),
('TW', 'TWN', 'Taiwan', '158'),
('TJ', 'TJK', 'Tajikistan', '762'),
('TZ', 'TZA', 'Tanzania', '834'),
('TH', 'THA', 'Thailand', '764'),
('TL', 'TLS', 'Timor-Leste', '626'),
('TG', 'TGO', 'Togo', '768'),
('TO', 'TON', 'Tonga', '776'),
('TT', 'TTO', 'Trinidad and Tobago', '780'),
('TN', 'TUN', 'Tunisia', '788'),
('TR', 'TUR', 'Turkey', '792'),
('TM', 'TKM', 'Turkmenistan', '795'),
('TV', 'TUV', 'Tuvalu', '798'),
('UG', 'UGA', 'Uganda', '800'),
('UA', 'UKR', 'Ukraine', '804'),
('AE', 'ARE', 'United Arab Emirates', '784'),
('GB', 'GBR', 'United Kingdom', '826'),
('US', 'USA', 'United States', '840'),
('UY', 'URY', 'Uruguay', '858'),
('UZ', 'UZB', 'Uzbekistan', '860'),
('VU', 'VUT', 'Vanuatu', '548'),
('VA', 'VAT', 'Vatican City', '336'),
('VE', 'VEN', 'Venezuela', '862'),
('VN', 'VNM', 'Vietnam', '704'),
('YE', 'YEM', 'Yemen', '887'),
('ZM', 'ZMB', 'Zambia', '894'),
('ZW', 'ZWE', 'Zimbabwe', '716')
ON CONFLICT (iso2) DO NOTHING;

\echo 'ISO codes loaded\n'

-- ============================================================================
-- PHASE 3: AUDIT CURRENT COUNTRY CODE COLUMNS
-- ============================================================================

\echo 'PHASE 3: Auditing current country code columns\n'

-- Find all columns with 'country' in the name
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    CASE
        WHEN character_maximum_length = 2 THEN 'ISO2 (OK)'
        WHEN character_maximum_length = 3 THEN 'ISO3 (NEEDS FIX)'
        WHEN data_type = 'text' OR character_maximum_length IS NULL THEN 'UNBOUNDED (FIX)'
        ELSE 'UNKNOWN'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name LIKE '%country%'
ORDER BY table_name, column_name;

-- ============================================================================
-- PHASE 4: VALIDATE EXISTING DATA
-- ============================================================================

\echo 'PHASE 4: Validating existing country codes\n'

-- Check profiles.country_code
\echo 'Checking profiles.country_code:\n'
SELECT
    country_code,
    LENGTH(country_code) AS code_length,
    COUNT(*) AS count,
    CASE
        WHEN LENGTH(country_code) = 2 THEN 'ISO2'
        WHEN LENGTH(country_code) = 3 THEN 'ISO3'
        ELSE 'INVALID'
    END AS format
FROM profiles
WHERE country_code IS NOT NULL
GROUP BY country_code
ORDER BY COUNT(*) DESC;

-- Check agencies.country_code
\echo 'Checking agencies.country_code:\n'
SELECT
    country_code,
    LENGTH(country_code) AS code_length,
    COUNT(*) AS count
FROM agencies
WHERE country_code IS NOT NULL
GROUP BY country_code
ORDER BY COUNT(*) DESC;

-- Check countries table
\echo 'Checking countries.code:\n'
SELECT
    code,
    LENGTH(code) AS code_length,
    name
FROM countries
ORDER BY code;

-- ============================================================================
-- PHASE 5: CONVERSION SCRIPT (ISO3 -> ISO2)
-- ============================================================================

\echo 'PHASE 5: Conversion script (if ISO3 codes found)\n'

-- Backup tables first (optional but recommended)
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;
-- CREATE TABLE agencies_backup AS SELECT * FROM agencies;

-- Convert profiles.country_code IF it's ISO3
-- Only run if audit shows ISO3 codes exist

\echo 'Converting profiles.country_code from ISO3 to ISO2:\n'

UPDATE profiles
SET country_code = (
    SELECT iso2
    FROM iso_country_codes
    WHERE iso3 = profiles.country_code
)
WHERE LENGTH(country_code) = 3
    AND country_code IN (SELECT iso3 FROM iso_country_codes);

-- Report unconverted codes (if any)
SELECT country_code, COUNT(*)
FROM profiles
WHERE LENGTH(country_code) != 2 AND country_code IS NOT NULL
GROUP BY country_code;

-- Convert agencies.country_code
\echo 'Converting agencies.country_code from ISO3 to ISO2:\n'

UPDATE agencies
SET country_code = (
    SELECT iso2
    FROM iso_country_codes
    WHERE iso3 = agencies.country_code
)
WHERE LENGTH(country_code) = 3
    AND country_code IN (SELECT iso3 FROM iso_country_codes);

-- Convert any other tables with country codes
-- Repeat pattern for cities, regions, national_parks, etc.

\echo 'Converting cities.country_code:\n'
UPDATE cities
SET country_code = (
    SELECT iso2 FROM iso_country_codes
    WHERE iso3 = cities.country_code
)
WHERE LENGTH(country_code) = 3;

\echo 'Converting regions.country_code:\n'
UPDATE regions
SET country_code = (
    SELECT iso2 FROM iso_country_codes
    WHERE iso3 = regions.country_code
)
WHERE LENGTH(country_code) = 3;

\echo 'Converting national_parks.country_code:\n'
UPDATE national_parks
SET country_code = (
    SELECT iso2 FROM iso_country_codes
    WHERE iso3 = national_parks.country_code
)
WHERE LENGTH(country_code) = 3;

-- ============================================================================
-- PHASE 6: ALTER COLUMN TYPES
-- ============================================================================

\echo 'PHASE 6: Enforcing char(2) on country code columns\n'

-- Change column types to char(2) to prevent future ISO3 entries
ALTER TABLE profiles
ALTER COLUMN country_code TYPE char(2);

ALTER TABLE agencies
ALTER COLUMN country_code TYPE char(2);

ALTER TABLE cities
ALTER COLUMN country_code TYPE char(2);

ALTER TABLE regions
ALTER COLUMN country_code TYPE char(2);

ALTER TABLE national_parks
ALTER COLUMN country_code TYPE char(2);

ALTER TABLE countries
ALTER COLUMN code TYPE char(2);

-- If jobs table has location_country
ALTER TABLE jobs
ALTER COLUMN location_country TYPE char(2);

\echo 'Column types updated to char(2)\n'

-- ============================================================================
-- PHASE 7: SYNC countries TABLE WITH ISO MAPPING
-- ============================================================================

\echo 'PHASE 7: Syncing countries table with ISO mapping\n'

-- Option A: Update existing countries table with ISO3 reference
ALTER TABLE countries
ADD COLUMN IF NOT EXISTS iso3 char(3);

UPDATE countries
SET iso3 = (
    SELECT iso3
    FROM iso_country_codes
    WHERE iso2 = countries.code
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_iso3
ON countries(iso3)
WHERE iso3 IS NOT NULL;

-- Option B: Replace countries table entirely (use with caution)
-- DROP TABLE IF EXISTS countries CASCADE;
-- ALTER TABLE iso_country_codes RENAME TO countries;
-- ALTER TABLE countries RENAME COLUMN iso2 TO code;

\echo 'Countries table synced\n'

-- ============================================================================
-- PHASE 8: ADD CHECK CONSTRAINTS
-- ============================================================================

\echo 'PHASE 8: Adding check constraints for country codes\n'

-- Ensure all country codes reference valid ISO2 codes
ALTER TABLE profiles
ADD CONSTRAINT profiles_country_valid
CHECK (country_code IS NULL OR country_code IN (SELECT code FROM countries));

ALTER TABLE agencies
ADD CONSTRAINT agencies_country_valid
CHECK (country_code IS NULL OR country_code IN (SELECT code FROM countries));

ALTER TABLE cities
ADD CONSTRAINT cities_country_valid
CHECK (country_code IN (SELECT code FROM countries));

ALTER TABLE regions
ADD CONSTRAINT regions_country_valid
CHECK (country_code IN (SELECT code FROM countries));

ALTER TABLE national_parks
ADD CONSTRAINT parks_country_valid
CHECK (country_code IN (SELECT code FROM countries));

\echo 'Check constraints added\n'

-- ============================================================================
-- PHASE 9: VERIFY CONVERSION
-- ============================================================================

\echo 'PHASE 9: Verification queries\n'

\echo 'All country codes should now be char(2):\n'
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name LIKE '%country%'
    AND data_type IN ('character', 'character varying', 'text')
ORDER BY table_name;

\echo 'All country codes should be valid ISO2:\n'
SELECT
    'profiles' AS table_name,
    country_code,
    COUNT(*) AS count
FROM profiles
WHERE country_code IS NOT NULL
GROUP BY country_code
HAVING country_code NOT IN (SELECT code FROM countries)

UNION ALL

SELECT
    'agencies' AS table_name,
    country_code,
    COUNT(*) AS count
FROM agencies
WHERE country_code IS NOT NULL
GROUP BY country_code
HAVING country_code NOT IN (SELECT code FROM countries);

\echo '\nIf above query returns rows, those are invalid country codes!\n'

-- ============================================================================
-- PHASE 10: CLEANUP
-- ============================================================================

\echo 'PHASE 10: Cleanup (optional)\n'

-- Keep iso_country_codes table as reference, or drop it:
-- DROP TABLE IF EXISTS iso_country_codes;

-- Drop backup tables after verification:
-- DROP TABLE IF EXISTS profiles_backup;
-- DROP TABLE IF EXISTS agencies_backup;

\timing off

\echo '\n=== COUNTRY CODE STANDARDIZATION COMPLETE ===\n'
\echo 'All country codes are now ISO2 (char(2))\n'
\echo 'Run verification queries to confirm\n'

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

\echo '\n=== ROLLBACK SCRIPT ===\n'
\echo 'If conversion fails, restore from backups:\n'
\echo 'DROP TABLE IF EXISTS profiles CASCADE;'
\echo 'CREATE TABLE profiles AS SELECT * FROM profiles_backup;'
\echo '-- Repeat for all converted tables\n'

\echo 'Or manually revert column types:\n'
\echo 'ALTER TABLE profiles ALTER COLUMN country_code TYPE varchar(3);'
\echo '-- Repeat for all tables\n'
