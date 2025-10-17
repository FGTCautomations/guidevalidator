-- Add verification fields for admin verification dashboard
-- This migration adds selfie_url and verification fields to application tables

-- Add selfie_url to guide_applications
ALTER TABLE public.guide_applications
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Add selfie_url and verification fields to agency_applications
ALTER TABLE public.agency_applications
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Add verification fields to dmc_applications
ALTER TABLE public.dmc_applications
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Add verification fields to transport_applications
ALTER TABLE public.transport_applications
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Create indexes for verification queries
CREATE INDEX IF NOT EXISTS idx_guide_applications_verification_status ON public.guide_applications(verification_status);
CREATE INDEX IF NOT EXISTS idx_agency_applications_verification_status ON public.agency_applications(verification_status);
CREATE INDEX IF NOT EXISTS idx_dmc_applications_verification_status ON public.dmc_applications(verification_status);
CREATE INDEX IF NOT EXISTS idx_transport_applications_verification_status ON public.transport_applications(verification_status);

-- Create function to log admin verification actions
CREATE OR REPLACE FUNCTION public.log_verification_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log to audit_logs when verification status changes
  IF (TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      occurred_at
    ) VALUES (
      NEW.verified_by,
      CASE NEW.verification_status
        WHEN 'approved' THEN 'verification_approved'
        WHEN 'rejected' THEN 'verification_rejected'
        ELSE 'verification_updated'
      END,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'notes', NEW.verification_notes,
        'applicant_email', COALESCE(NEW.contact_email, 'unknown')
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for audit logging on all application tables
DROP TRIGGER IF EXISTS guide_applications_verification_audit ON public.guide_applications;
CREATE TRIGGER guide_applications_verification_audit
  AFTER UPDATE ON public.guide_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_action();

DROP TRIGGER IF EXISTS agency_applications_verification_audit ON public.agency_applications;
CREATE TRIGGER agency_applications_verification_audit
  AFTER UPDATE ON public.agency_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_action();

DROP TRIGGER IF EXISTS dmc_applications_verification_audit ON public.dmc_applications;
CREATE TRIGGER dmc_applications_verification_audit
  AFTER UPDATE ON public.dmc_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_action();

DROP TRIGGER IF EXISTS transport_applications_verification_audit ON public.transport_applications;
CREATE TRIGGER transport_applications_verification_audit
  AFTER UPDATE ON public.transport_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_action();

-- Comment on new columns
COMMENT ON COLUMN guide_applications.selfie_url IS 'URL to selfie photo for identity verification';
COMMENT ON COLUMN guide_applications.verification_status IS 'Admin verification status: pending, approved, rejected';
COMMENT ON COLUMN guide_applications.verification_notes IS 'Admin notes/feedback on verification decision';
COMMENT ON COLUMN guide_applications.verified_at IS 'Timestamp when verification decision was made';
COMMENT ON COLUMN guide_applications.verified_by IS 'Admin user who made the verification decision';

COMMENT ON COLUMN agency_applications.logo_url IS 'URL to agency logo for verification';
COMMENT ON COLUMN dmc_applications.logo_url IS 'URL to DMC logo for verification';
COMMENT ON COLUMN transport_applications.logo_url IS 'URL to transport company logo for verification';
