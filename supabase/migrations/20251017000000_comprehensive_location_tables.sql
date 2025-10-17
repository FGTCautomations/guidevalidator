-- =====================================================
-- Comprehensive Location Tables
-- =====================================================
-- Creates full hierarchical location system:
-- Countries → Regions/Provinces → Cities & National Parks → Tourist Attractions
-- =====================================================

-- 1. COUNTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(2) UNIQUE NOT NULL,  -- ISO 3166-1 alpha-2 code (e.g., "US", "VN")
  name varchar(255) NOT NULL,
  official_name varchar(255),
  region varchar(100),  -- Continent/region (e.g., "Asia", "Europe")
  subregion varchar(100),  -- Sub-region (e.g., "Southeast Asia", "Western Europe")
  population bigint,
  area_km2 numeric,
  capital varchar(255),
  currency_code varchar(3),
  currency_name varchar(100),
  phone_code varchar(10),
  flag_emoji varchar(10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_countries_code ON public.countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_name ON public.countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_region ON public.countries(region);

-- 2. REGIONS/PROVINCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type varchar(50),  -- "Province", "State", "Region", "Prefecture", etc.
  code varchar(10),  -- Internal code (e.g., "CA" for California)
  population bigint,
  area_km2 numeric,
  capital varchar(255),  -- Capital city of this region
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_code, name)
);

-- Indexes for fast lookups and cascading
CREATE INDEX IF NOT EXISTS idx_regions_country_code ON public.regions(country_code);
CREATE INDEX IF NOT EXISTS idx_regions_name ON public.regions(name);
CREATE INDEX IF NOT EXISTS idx_regions_search ON public.regions USING gin(to_tsvector('english', name));

-- 3. CITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  population bigint,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  timezone varchar(100),
  is_capital boolean DEFAULT false,
  is_major_city boolean DEFAULT false,  -- For filtering important cities
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cities_region_id ON public.cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_country_code ON public.cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_major ON public.cities(is_major_city) WHERE is_major_city = true;
CREATE INDEX IF NOT EXISTS idx_cities_search ON public.cities USING gin(to_tsvector('english', name));

-- 4. NATIONAL PARKS TABLE
-- =====================================================
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_national_parks_region_id ON public.national_parks(region_id);
CREATE INDEX IF NOT EXISTS idx_national_parks_country_code ON public.national_parks(country_code);
CREATE INDEX IF NOT EXISTS idx_national_parks_name ON public.national_parks(name);
CREATE INDEX IF NOT EXISTS idx_national_parks_unesco ON public.national_parks(unesco_site) WHERE unesco_site = true;
CREATE INDEX IF NOT EXISTS idx_national_parks_search ON public.national_parks USING gin(to_tsvector('english', name));

-- 5. TOURIST ATTRACTIONS TABLE (OPTIONAL)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tourist_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE,
  park_id uuid REFERENCES public.national_parks(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type varchar(100),  -- "Museum", "Monument", "Temple", "Beach", "Landmark", etc.
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  description text,
  unesco_site boolean DEFAULT false,
  rating numeric(2, 1),  -- 1.0 to 5.0
  visitor_count_annual bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tourist_attraction_location CHECK (city_id IS NOT NULL OR park_id IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tourist_attractions_city_id ON public.tourist_attractions(city_id);
CREATE INDEX IF NOT EXISTS idx_tourist_attractions_park_id ON public.tourist_attractions(park_id);
CREATE INDEX IF NOT EXISTS idx_tourist_attractions_country_code ON public.tourist_attractions(country_code);
CREATE INDEX IF NOT EXISTS idx_tourist_attractions_name ON public.tourist_attractions(name);
CREATE INDEX IF NOT EXISTS idx_tourist_attractions_search ON public.tourist_attractions USING gin(to_tsvector('english', name));

-- =====================================================
-- JUNCTION TABLES FOR GUIDE LOCATIONS
-- =====================================================
-- These tables link guides to specific locations they operate in

-- Guide Countries
CREATE TABLE IF NOT EXISTS public.guide_countries (
  guide_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (guide_id, country_code)
);

-- Guide Regions
CREATE TABLE IF NOT EXISTS public.guide_regions (
  guide_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (guide_id, region_id)
);

-- Guide Cities
CREATE TABLE IF NOT EXISTS public.guide_cities (
  guide_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (guide_id, city_id)
);

-- Guide National Parks
CREATE TABLE IF NOT EXISTS public.guide_parks (
  guide_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  park_id uuid NOT NULL REFERENCES public.national_parks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (guide_id, park_id)
);

-- Guide Tourist Attractions (with "All" option)
CREATE TABLE IF NOT EXISTS public.guide_attractions (
  guide_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attraction_id uuid REFERENCES public.tourist_attractions(id) ON DELETE CASCADE,
  all_attractions boolean DEFAULT false,  -- If true, guide covers ALL attractions in their cities/parks
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (guide_id, attraction_id)
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_attractions ENABLE ROW LEVEL SECURITY;

-- Location tables: Public read access (anyone can view locations)
CREATE POLICY "countries_public_read" ON public.countries FOR SELECT USING (true);
CREATE POLICY "regions_public_read" ON public.regions FOR SELECT USING (true);
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT USING (true);
CREATE POLICY "national_parks_public_read" ON public.national_parks FOR SELECT USING (true);
CREATE POLICY "tourist_attractions_public_read" ON public.tourist_attractions FOR SELECT USING (true);

-- Junction tables: Users can manage their own locations
CREATE POLICY "guide_countries_own" ON public.guide_countries
  FOR ALL USING (auth.uid() = guide_id);

CREATE POLICY "guide_regions_own" ON public.guide_regions
  FOR ALL USING (auth.uid() = guide_id);

CREATE POLICY "guide_cities_own" ON public.guide_cities
  FOR ALL USING (auth.uid() = guide_id);

CREATE POLICY "guide_parks_own" ON public.guide_parks
  FOR ALL USING (auth.uid() = guide_id);

CREATE POLICY "guide_attractions_own" ON public.guide_attractions
  FOR ALL USING (auth.uid() = guide_id);

-- Admins can manage everything
CREATE POLICY "locations_admin_all" ON public.countries
  FOR ALL USING (public.is_admin());

CREATE POLICY "locations_admin_all_regions" ON public.regions
  FOR ALL USING (public.is_admin());

CREATE POLICY "locations_admin_all_cities" ON public.cities
  FOR ALL USING (public.is_admin());

CREATE POLICY "locations_admin_all_parks" ON public.national_parks
  FOR ALL USING (public.is_admin());

CREATE POLICY "locations_admin_all_attractions" ON public.tourist_attractions
  FOR ALL USING (public.is_admin());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all regions for a country
CREATE OR REPLACE FUNCTION public.get_regions_by_country(country_code_param varchar(2))
RETURNS TABLE (
  id uuid,
  name varchar(255),
  type varchar(50),
  code varchar(10)
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, type, code
  FROM public.regions
  WHERE country_code = country_code_param
  ORDER BY name;
$$;

-- Function to get all cities for a region
CREATE OR REPLACE FUNCTION public.get_cities_by_region(region_id_param uuid)
RETURNS TABLE (
  id uuid,
  name varchar(255),
  population bigint,
  is_capital boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, population, is_capital
  FROM public.cities
  WHERE region_id = region_id_param
  ORDER BY is_capital DESC, population DESC NULLS LAST, name;
$$;

-- Function to get all national parks for a region
CREATE OR REPLACE FUNCTION public.get_parks_by_region(region_id_param uuid)
RETURNS TABLE (
  id uuid,
  name varchar(255),
  type varchar(100),
  unesco_site boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, type, unesco_site
  FROM public.national_parks
  WHERE region_id = region_id_param
  ORDER BY unesco_site DESC, name;
$$;

-- Function to get tourist attractions by city
CREATE OR REPLACE FUNCTION public.get_attractions_by_city(city_id_param uuid)
RETURNS TABLE (
  id uuid,
  name varchar(255),
  type varchar(100),
  rating numeric(2, 1)
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, type, rating
  FROM public.tourist_attractions
  WHERE city_id = city_id_param
  ORDER BY rating DESC NULLS LAST, name;
$$;

-- Function to get tourist attractions by park
CREATE OR REPLACE FUNCTION public.get_attractions_by_park(park_id_param uuid)
RETURNS TABLE (
  id uuid,
  name varchar(255),
  type varchar(100),
  rating numeric(2, 1)
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, type, rating
  FROM public.tourist_attractions
  WHERE park_id = park_id_param
  ORDER BY rating DESC NULLS LAST, name;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.countries IS 'All countries in the world (195 total)';
COMMENT ON TABLE public.regions IS 'Provinces, states, regions within countries (~3000+ worldwide)';
COMMENT ON TABLE public.cities IS 'Major cities worldwide (~50,000+)';
COMMENT ON TABLE public.national_parks IS 'National parks and protected areas (~10,000+)';
COMMENT ON TABLE public.tourist_attractions IS 'Major tourist attractions (~100,000+, optional)';

COMMENT ON TABLE public.guide_countries IS 'Countries where guide operates';
COMMENT ON TABLE public.guide_regions IS 'Specific regions/provinces where guide operates';
COMMENT ON TABLE public.guide_cities IS 'Specific cities where guide operates';
COMMENT ON TABLE public.guide_parks IS 'National parks where guide operates';
COMMENT ON TABLE public.guide_attractions IS 'Tourist attractions guide covers (or "all" flag)';
