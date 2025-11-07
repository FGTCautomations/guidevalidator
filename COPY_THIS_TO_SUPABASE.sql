-- GDPR/CCPA Compliance Schema
-- Creates tables for consent management, DSAR requests, and data retention

-- User Consent Management
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('functional', 'analytics', 'marketing')),
  granted boolean NOT NULL DEFAULT false,
  consent_date timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, consent_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON public.user_consents(consent_type);

-- Data Subject Access Requests (DSAR)
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('export', 'delete', 'rectify', 'restrict', 'portability', 'object')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  request_data jsonb,
  response_data jsonb,
  ip_address inet,
  user_agent text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for DSAR requests
CREATE INDEX IF NOT EXISTS idx_dsar_requests_user_id ON public.dsar_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_status ON public.dsar_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_type ON public.dsar_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_requested_at ON public.dsar_requests(requested_at DESC);

-- Add soft delete columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- Add soft delete columns to agencies table
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_reason text,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- Data Retention Archive Table
CREATE TABLE IF NOT EXISTS public.archived_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id uuid NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('profile', 'agency')),
  archived_data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL DEFAULT 'retention_policy',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for archived accounts
CREATE INDEX IF NOT EXISTS idx_archived_accounts_original_user_id ON public.archived_accounts(original_user_id);
CREATE INDEX IF NOT EXISTS idx_archived_accounts_archived_at ON public.archived_accounts(archived_at DESC);

-- Audit log for GDPR operations
CREATE TABLE IF NOT EXISTS public.gdpr_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for audit log
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_user_id ON public.gdpr_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_action ON public.gdpr_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_performed_at ON public.gdpr_audit_log(performed_at DESC);

-- Row Level Security Policies

-- user_consents: Users can only see and manage their own consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON public.user_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON public.user_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON public.user_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- dsar_requests: Users can only see and create their own requests
ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DSAR requests"
  ON public.dsar_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own DSAR requests"
  ON public.dsar_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all DSAR requests
CREATE POLICY "Admins can view all DSAR requests"
  ON public.dsar_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update DSAR requests"
  ON public.dsar_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- archived_accounts: Only admins can access
ALTER TABLE public.archived_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view archived accounts"
  ON public.archived_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- gdpr_audit_log: Only admins can access
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view GDPR audit log"
  ON public.gdpr_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dsar_requests_updated_at
  BEFORE UPDATE ON public.dsar_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log GDPR actions
CREATE OR REPLACE FUNCTION public.log_gdpr_action(
  p_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.gdpr_audit_log (
    user_id,
    action,
    details,
    ip_address,
    user_agent,
    performed_by
  ) VALUES (
    p_user_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent,
    auth.uid()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data (for DSAR)
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_profile jsonb;
  v_agency jsonb;
  v_guides jsonb;
  v_reviews jsonb;
  v_consents jsonb;
BEGIN
  -- Check if user is requesting their own data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only export your own data';
  END IF;

  -- Get profile data
  SELECT jsonb_build_object(
    'profile', row_to_json(p.*)
  ) INTO v_profile
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Get agency data if exists
  SELECT jsonb_build_object(
    'agency', row_to_json(a.*)
  ) INTO v_agency
  FROM public.agencies a
  WHERE a.id = p_user_id;

  -- Get guide data if exists
  SELECT jsonb_agg(row_to_json(g.*)) INTO v_guides
  FROM public.guides g
  WHERE g.profile_id = p_user_id;

  -- Get reviews written by user
  SELECT jsonb_agg(row_to_json(r.*)) INTO v_reviews
  FROM public.reviews r
  WHERE r.reviewer_id = p_user_id;

  -- Get consent records
  SELECT jsonb_agg(row_to_json(c.*)) INTO v_consents
  FROM public.user_consents c
  WHERE c.user_id = p_user_id;

  -- Combine all data
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'exported_at', now(),
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'agency', COALESCE(v_agency, '{}'::jsonb),
    'guides', COALESCE(v_guides, '[]'::jsonb),
    'reviews', COALESCE(v_reviews, '[]'::jsonb),
    'consents', COALESCE(v_consents, '[]'::jsonb)
  );

  -- Log the export action
  PERFORM public.log_gdpr_action(
    p_user_id,
    'data_export',
    jsonb_build_object('export_size', pg_column_size(v_result))
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete account
CREATE OR REPLACE FUNCTION public.soft_delete_account(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_is_profile boolean;
  v_is_agency boolean;
BEGIN
  -- Check if user is deleting their own account
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_is_profile;

  -- Check if agency exists
  SELECT EXISTS(SELECT 1 FROM public.agencies WHERE id = p_user_id) INTO v_is_agency;

  -- Soft delete profile
  IF v_is_profile THEN
    UPDATE public.profiles
    SET
      deleted_at = now(),
      deletion_reason = p_reason,
      deletion_requested_at = now()
    WHERE id = p_user_id;
  END IF;

  -- Soft delete agency
  IF v_is_agency THEN
    UPDATE public.agencies
    SET
      deleted_at = now(),
      deletion_reason = p_reason,
      deletion_requested_at = now()
    WHERE id = p_user_id;
  END IF;

  -- Log the deletion
  PERFORM public.log_gdpr_action(
    p_user_id,
    'account_deletion',
    jsonb_build_object(
      'reason', p_reason,
      'is_profile', v_is_profile,
      'is_agency', v_is_agency
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.user_consents IS 'Stores user consent preferences for GDPR/CCPA compliance';
COMMENT ON TABLE public.dsar_requests IS 'Tracks Data Subject Access Requests for GDPR/CCPA compliance';
COMMENT ON TABLE public.archived_accounts IS 'Archives account data after deletion or retention period';
COMMENT ON TABLE public.gdpr_audit_log IS 'Audit log for all GDPR-related operations';
COMMENT ON FUNCTION public.export_user_data IS 'Exports all personal data for a user (DSAR compliance)';
COMMENT ON FUNCTION public.soft_delete_account IS 'Soft deletes a user account with timestamp and reason';
