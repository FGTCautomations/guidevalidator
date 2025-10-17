-- Availability Holds System
-- Allows agencies/DMCs to place holds on guide/transport availability
-- Holds auto-expire after 48 hours if not accepted

-- Create availability_holds table
CREATE TABLE IF NOT EXISTS public.availability_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_role text NOT NULL CHECK (requester_role IN ('agency', 'dmc')),
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role text NOT NULL CHECK (target_role IN ('guide', 'transport')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  message text,
  job_reference text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (ends_at > starts_at),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_holds_requester ON public.availability_holds(requester_id);
CREATE INDEX idx_holds_target ON public.availability_holds(target_id);
CREATE INDEX idx_holds_status ON public.availability_holds(status);
CREATE INDEX idx_holds_dates ON public.availability_holds(starts_at, ends_at);
CREATE INDEX idx_holds_expiry ON public.availability_holds(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.availability_holds ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Requesters can view their own holds
CREATE POLICY "Users can view their own hold requests"
  ON public.availability_holds
  FOR SELECT
  USING (requester_id = auth.uid());

-- Targets can view holds placed on them
CREATE POLICY "Targets can view holds placed on them"
  ON public.availability_holds
  FOR SELECT
  USING (target_id = auth.uid());

-- Admins can view all holds
CREATE POLICY "Admins can view all holds"
  ON public.availability_holds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Agencies and DMCs can create holds
CREATE POLICY "Agencies and DMCs can create holds"
  ON public.availability_holds
  FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('agency', 'dmc')
    )
  );

-- Requesters can cancel their pending holds
CREATE POLICY "Requesters can cancel their pending holds"
  ON public.availability_holds
  FOR UPDATE
  USING (
    requester_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- Targets can accept/decline holds placed on them
CREATE POLICY "Targets can respond to holds"
  ON public.availability_holds
  FOR UPDATE
  USING (
    target_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status IN ('accepted', 'declined')
  );

-- Function to auto-expire holds after 48 hours
CREATE OR REPLACE FUNCTION public.expire_pending_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.availability_holds
  SET
    status = 'expired',
    updated_at = now()
  WHERE
    status = 'pending'
    AND expires_at < now();
END;
$$;

-- Function to check for overlapping holds
CREATE OR REPLACE FUNCTION public.check_hold_overlap(
  p_target_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_hold_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  overlap_count integer;
BEGIN
  SELECT COUNT(*)
  INTO overlap_count
  FROM public.availability_holds
  WHERE target_id = p_target_id
    AND status IN ('pending', 'accepted')
    AND (id IS DISTINCT FROM p_exclude_hold_id)
    AND (
      (starts_at <= p_starts_at AND ends_at > p_starts_at)
      OR (starts_at < p_ends_at AND ends_at >= p_ends_at)
      OR (starts_at >= p_starts_at AND ends_at <= p_ends_at)
    );

  RETURN overlap_count > 0;
END;
$$;

-- Function to get hold statistics
CREATE OR REPLACE FUNCTION public.get_hold_stats(p_user_id uuid)
RETURNS TABLE (
  total_holds bigint,
  pending_holds bigint,
  accepted_holds bigint,
  declined_holds bigint,
  expired_holds bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First check if user has access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE 1=1) as total_holds,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_holds,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_holds,
    COUNT(*) FILTER (WHERE status = 'declined') as declined_holds,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_holds
  FROM public.availability_holds
  WHERE target_id = p_user_id
    OR requester_id = p_user_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_holds_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();

  -- Set responded_at when status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    NEW.responded_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER set_holds_timestamp
  BEFORE UPDATE ON public.availability_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_holds_timestamp();

-- Trigger to create blocked availability slot when hold is accepted
CREATE OR REPLACE FUNCTION public.create_block_on_hold_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create block if status changed from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO public.availability_slots (
      owner_id,
      owner_role,
      starts_at,
      ends_at,
      status
    ) VALUES (
      NEW.target_id,
      NEW.target_role,
      NEW.starts_at,
      NEW.ends_at,
      'blocked'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER create_availability_block_on_accept
  AFTER UPDATE ON public.availability_holds
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.create_block_on_hold_accept();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.availability_holds TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_holds() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_hold_overlap(uuid, timestamptz, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hold_stats(uuid) TO authenticated;

-- Insert initial settings
COMMENT ON TABLE public.availability_holds IS 'Holds placed by agencies/DMCs on guide/transport availability. Auto-expires after 48 hours.';
COMMENT ON COLUMN public.availability_holds.expires_at IS 'Hold automatically expires if not responded to by this time';
COMMENT ON COLUMN public.availability_holds.job_reference IS 'Optional reference to a specific job or booking';
COMMENT ON COLUMN public.availability_holds.responded_at IS 'Timestamp when target responded (accepted/declined)';
