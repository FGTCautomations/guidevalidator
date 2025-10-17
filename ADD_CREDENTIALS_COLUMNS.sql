-- Add columns for credentials and licensing to guides table
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS license_authority TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS license_proof_url TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS expertise_areas TEXT[];
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS experience_summary TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS sample_itineraries TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS media_gallery TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS availability_notes TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Columns added successfully!' as status;
