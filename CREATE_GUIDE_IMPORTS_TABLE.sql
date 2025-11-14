-- =====================================================
-- CREATE guide_imports TABLE
-- =====================================================

-- Create table to store imported guide data
CREATE TABLE IF NOT EXISTS public.guide_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  full_name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,

  -- License Details
  license_authority TEXT,
  license_expiry_date TEXT,
  license_card_type TEXT,

  -- Additional Info
  spoken_languages TEXT[],
  years_experience INTEGER,

  -- Original Data
  experience_text TEXT,
  image_url TEXT,
  source_url TEXT,

  -- Import Metadata
  import_source TEXT DEFAULT 'CSV_IMPORT',
  import_date TIMESTAMPTZ DEFAULT NOW(),

  -- Claim Status
  claimed BOOLEAN DEFAULT FALSE,
  claimed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_guide_imports_license_number ON public.guide_imports(license_number);
CREATE INDEX IF NOT EXISTS idx_guide_imports_full_name ON public.guide_imports(full_name);
CREATE INDEX IF NOT EXISTS idx_guide_imports_claimed ON public.guide_imports(claimed) WHERE NOT claimed;
CREATE INDEX IF NOT EXISTS idx_guide_imports_claimed_by ON public.guide_imports(claimed_by_profile_id) WHERE claimed_by_profile_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.guide_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view guide imports
CREATE POLICY "Admins can view all guide imports"
  ON public.guide_imports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can do everything (for import scripts)
CREATE POLICY "Service role has full access"
  ON public.guide_imports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE public.guide_imports IS 'Staging table for imported guide data. Guides can claim their profiles using their license numbers.';

-- Verification
SELECT 'guide_imports table created successfully!' as message;
SELECT COUNT(*) as total_imports FROM guide_imports;
