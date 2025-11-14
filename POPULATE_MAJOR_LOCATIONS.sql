-- ============================================================
-- POPULATE MAJOR CITIES AND TOURIST ATTRACTIONS
-- ============================================================
-- This script adds major cities and tourist attractions to regions
-- that are commonly used by travel agencies and tour guides
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
-- ============================================================

-- ============================================================
-- CREATE TABLES IF THEY DON'T EXIST
-- ============================================================

-- Create national_parks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.national_parks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  official_name varchar(255),
  type varchar(100),  -- "National Park", "Nature Reserve", "Protected Area", etc.
  area_km2 numeric,
  established_year integer,
  unesco_site boolean DEFAULT false,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_national_parks_region_id ON public.national_parks(region_id);
CREATE INDEX IF NOT EXISTS idx_national_parks_country_code ON public.national_parks(country_code);
CREATE INDEX IF NOT EXISTS idx_national_parks_name ON public.national_parks(name);
CREATE INDEX IF NOT EXISTS idx_national_parks_unesco ON public.national_parks(unesco_site) WHERE unesco_site = true;
CREATE INDEX IF NOT EXISTS idx_national_parks_search ON public.national_parks USING gin(to_tsvector('english', name));

-- Enable RLS and create policies for public read access
ALTER TABLE public.national_parks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to national parks" ON public.national_parks;
DROP POLICY IF EXISTS "Allow authenticated read access to national parks" ON public.national_parks;

-- Create policy to allow public read access (needed for API routes)
CREATE POLICY "Allow public read access to national parks"
ON public.national_parks
FOR SELECT
USING (true);

-- Also allow authenticated users to read
CREATE POLICY "Allow authenticated read access to national parks"
ON public.national_parks
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Helper function to find region ID by name and country
CREATE OR REPLACE FUNCTION get_region_id(region_name TEXT, country TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM regions WHERE name = region_name AND country_code = country LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- NETHERLANDS - Major Cities by Province
-- ============================================================

-- Noord-Holland
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Noord-Holland', 'NL'),
  true,
  pop
FROM (VALUES
  ('Amsterdam', 872000),
  ('Haarlem', 162000),
  ('Zaanstad', 156000),
  ('Alkmaar', 109000),
  ('Hilversum', 90000),
  ('Amstelveen', 91000),
  ('Purmerend', 81000),
  ('Hoorn', 73000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Noord-Holland', 'NL')
);

-- Zuid-Holland
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Zuid-Holland', 'NL'),
  true,
  pop
FROM (VALUES
  ('Rotterdam', 651000),
  ('The Hague', 545000),
  ('Leiden', 125000),
  ('Dordrecht', 119000),
  ('Zoetermeer', 125000),
  ('Delft', 103000),
  ('Alphen aan den Rijn', 111000),
  ('Gouda', 73000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Zuid-Holland', 'NL')
);

-- Utrecht
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Utrecht', 'NL'),
  true,
  pop
FROM (VALUES
  ('Utrecht', 357000),
  ('Amersfoort', 157000),
  ('Veenendaal', 66000),
  ('Nieuwegein', 63000),
  ('Zeist', 64000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Utrecht', 'NL')
);

-- Noord-Brabant
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Noord-Brabant', 'NL'),
  true,
  pop
FROM (VALUES
  ('Eindhoven', 234000),
  ('Tilburg', 219000),
  ('Breda', 184000),
  ('s-Hertogenbosch', 155000),
  ('Helmond', 92000),
  ('Oss', 92000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Noord-Brabant', 'NL')
);

-- Gelderland
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Gelderland', 'NL'),
  true,
  pop
FROM (VALUES
  ('Nijmegen', 177000),
  ('Arnhem', 159000),
  ('Apeldoorn', 163000),
  ('Ede', 117000),
  ('Doetinchem', 58000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Gelderland', 'NL')
);

-- Limburg
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Limburg', 'NL'),
  true,
  pop
FROM (VALUES
  ('Maastricht', 122000),
  ('Venlo', 101000),
  ('Heerlen', 87000),
  ('Sittard-Geleen', 92000),
  ('Roermond', 58000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Limburg', 'NL')
);

-- Overijssel
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Overijssel', 'NL'),
  true,
  pop
FROM (VALUES
  ('Enschede', 159000),
  ('Zwolle', 128000),
  ('Almelo', 73000),
  ('Deventer', 100000),
  ('Hengelo', 81000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Overijssel', 'NL')
);

-- Groningen
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Groningen', 'NL'),
  true,
  pop
FROM (VALUES
  ('Groningen', 232000),
  ('Hoogezand-Sappemeer', 34000),
  ('Veendam', 27000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Groningen', 'NL')
);

-- Friesland
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Friesland', 'NL'),
  true,
  pop
FROM (VALUES
  ('Leeuwarden', 123000),
  ('Heerenveen', 50000),
  ('Sneek', 33000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Friesland', 'NL')
);

-- Drenthe
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Drenthe', 'NL'),
  true,
  pop
FROM (VALUES
  ('Emmen', 107000),
  ('Assen', 68000),
  ('Hoogeveen', 55000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Drenthe', 'NL')
);

-- Zeeland
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Zeeland', 'NL'),
  true,
  pop
FROM (VALUES
  ('Middelburg', 48000),
  ('Vlissingen', 44000),
  ('Terneuzen', 55000),
  ('Goes', 38000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Zeeland', 'NL')
);

-- Flevoland
INSERT INTO cities (id, name, country_code, region_id, is_major_city, population)
SELECT
  gen_random_uuid(),
  city_name,
  'NL',
  get_region_id('Flevoland', 'NL'),
  true,
  pop
FROM (VALUES
  ('Almere', 211000),
  ('Lelystad', 78000),
  ('Dronten', 42000)
) AS t(city_name, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM cities
  WHERE name = t.city_name
  AND region_id = get_region_id('Flevoland', 'NL')
);

-- ============================================================
-- NETHERLANDS - Tourist Attractions & National Parks
-- ============================================================

INSERT INTO national_parks (id, name, country_code, region_id, type, unesco_site)
SELECT
  gen_random_uuid(),
  park_name,
  'NL',
  get_region_id(region_name, 'NL'),
  park_type,
  is_unesco
FROM (VALUES
  ('Anne Frank House', 'Noord-Holland', 'museum', false),
  ('Rijksmuseum', 'Noord-Holland', 'museum', false),
  ('Van Gogh Museum', 'Noord-Holland', 'museum', false),
  ('Zaanse Schans', 'Noord-Holland', 'tourist_attraction', false),
  ('Keukenhof Gardens', 'Zuid-Holland', 'tourist_attraction', false),
  ('Kinderdijk Windmills', 'Zuid-Holland', 'heritage_site', true),
  ('Madurodam', 'Zuid-Holland', 'tourist_attraction', false),
  ('Deltawerken (Delta Works)', 'Zuid-Holland', 'engineering_site', false),
  ('Efteling Theme Park', 'Noord-Brabant', 'theme_park', false),
  ('De Hoge Veluwe National Park', 'Gelderland', 'national_park', false),
  ('Kröller-Müller Museum', 'Gelderland', 'museum', false),
  ('Burgers'' Zoo', 'Gelderland', 'zoo', false),
  ('Giethoorn Village', 'Overijssel', 'tourist_attraction', false),
  ('Maastricht Underground', 'Limburg', 'tourist_attraction', false),
  ('Valkenburg Caves', 'Limburg', 'tourist_attraction', false),
  ('Wadden Sea', 'Friesland', 'natural_site', true),
  ('Schiermonnikoog National Park', 'Friesland', 'national_park', false),
  ('Oostvaardersplassen', 'Flevoland', 'nature_reserve', false)
) AS t(park_name, region_name, park_type, is_unesco)
WHERE NOT EXISTS (
  SELECT 1 FROM national_parks
  WHERE name = t.park_name
  AND region_id = get_region_id(t.region_name, 'NL')
);

-- ============================================================
-- Summary
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Netherlands location data populated!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added cities for all 12 provinces';
  RAISE NOTICE 'Added major tourist attractions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Add similar data for other countries';
  RAISE NOTICE 'Common tourist destinations to populate:';
  RAISE NOTICE '  - Spain (Barcelona, Madrid, Valencia, Seville...)';
  RAISE NOTICE '  - France (Paris, Lyon, Marseille, Nice...)';
  RAISE NOTICE '  - Italy (Rome, Florence, Venice, Milan...)';
  RAISE NOTICE '  - Germany (Berlin, Munich, Hamburg, Cologne...)';
  RAISE NOTICE '  - UK (London, Edinburgh, Manchester...)';
  RAISE NOTICE '  - USA (New York, California, Florida...)';
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS get_region_id(TEXT, TEXT);
