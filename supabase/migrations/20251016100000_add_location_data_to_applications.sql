-- Add location_data column to all application tables
-- This stores the structured location data from the MultiCountryLocationSelector

-- Add to guide_applications
ALTER TABLE public.guide_applications
  ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}'::jsonb;

-- Add to agency_applications
ALTER TABLE public.agency_applications
  ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}'::jsonb;

-- Add to dmc_applications
ALTER TABLE public.dmc_applications
  ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}'::jsonb;

-- Add to transport_applications
ALTER TABLE public.transport_applications
  ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}'::jsonb;

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_guide_applications_location_data ON public.guide_applications USING gin(location_data);
CREATE INDEX IF NOT EXISTS idx_agency_applications_location_data ON public.agency_applications USING gin(location_data);
CREATE INDEX IF NOT EXISTS idx_dmc_applications_location_data ON public.dmc_applications USING gin(location_data);
CREATE INDEX IF NOT EXISTS idx_transport_applications_location_data ON public.transport_applications USING gin(location_data);

-- Add comments for documentation
COMMENT ON COLUMN public.guide_applications.location_data IS 'Structured location data: countries, regions, cities, parks from MultiCountryLocationSelector';
COMMENT ON COLUMN public.agency_applications.location_data IS 'Structured destination coverage data from MultiCountryLocationSelector';
COMMENT ON COLUMN public.dmc_applications.location_data IS 'Structured destination coverage data from MultiCountryLocationSelector';
COMMENT ON COLUMN public.transport_applications.location_data IS 'Structured service areas data from MultiCountryLocationSelector';

-- Example queries for location data
COMMENT ON TABLE public.guide_applications IS 'Guide applications with location_data JSONB field.
Example query to find guides in Vietnam:
SELECT * FROM guide_applications WHERE location_data @> ''{"countries": [{"countryCode": "VN"}]}'';

Example query to find guides in specific city:
SELECT * FROM guide_applications WHERE location_data::text ILIKE ''%Hanoi%'';
';
