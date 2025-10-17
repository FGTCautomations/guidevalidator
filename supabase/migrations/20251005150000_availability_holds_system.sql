-- =====================================================
-- Availability Holds System
-- =====================================================
-- Allows agencies/DMCs to request holds on guide or transport availability
-- with 48-hour auto-expiry and accept/decline workflow

-- Create holds table
CREATE TABLE IF NOT EXISTS public.availability_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is being held (guide or transport)
  holdee_id uuid NOT NULL,
  holdee_type text NOT NULL CHECK (holdee_type IN ('guide', 'transport')),

  -- Who is requesting the hold (agency or dmc)
  requester_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  requester_type text NOT NULL CHECK (requester_type IN ('agency', 'dmc', 'transport')),

  -- Hold details
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

  -- Optional message/notes
  request_message text,
  response_message text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  responded_at timestamptz,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS availability_holds_holdee_idx ON public.availability_holds(holdee_id, holdee_type);
CREATE INDEX IF NOT EXISTS availability_holds_requester_idx ON public.availability_holds(requester_id);
CREATE INDEX IF NOT EXISTS availability_holds_status_idx ON public.availability_holds(status);
CREATE INDEX IF NOT EXISTS availability_holds_dates_idx ON public.availability_holds(start_date, end_date);
CREATE INDEX IF NOT EXISTS availability_holds_expires_idx ON public.availability_holds(expires_at) WHERE status = 'pending';

-- Add comments for documentation
COMMENT ON TABLE public.availability_holds IS 'Holds on guide or transport availability requested by agencies/DMCs';
COMMENT ON COLUMN public.availability_holds.holdee_id IS 'ID of the guide or transport company being held';
COMMENT ON COLUMN public.availability_holds.holdee_type IS 'Type of holdee: guide or transport';
COMMENT ON COLUMN public.availability_holds.requester_id IS 'ID of the agency/DMC requesting the hold';
COMMENT ON COLUMN public.availability_holds.requester_type IS 'Type of requester: agency, dmc, or transport';
COMMENT ON COLUMN public.availability_holds.expires_at IS 'Auto-expires 48 hours after creation if not responded to';

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.availability_holds ENABLE ROW LEVEL SECURITY;

-- Guides and transport can view holds on their availability
CREATE POLICY "Users can view holds on their availability"
  ON public.availability_holds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.id = availability_holds.holdee_id
      AND profiles.role IN ('guide', 'transport')
    )
  );

-- Agencies/DMCs can view holds they created
CREATE POLICY "Requesters can view their own holds"
  ON public.availability_holds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = availability_holds.requester_id
    )
  );

-- Agencies/DMCs can create holds
CREATE POLICY "Agencies can create holds"
  ON public.availability_holds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('agency', 'dmc', 'transport')
      AND profiles.organization_id = availability_holds.requester_id
    )
  );

-- Guides and transport can update holds on their availability (accept/decline)
CREATE POLICY "Holdees can respond to holds"
  ON public.availability_holds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.id = availability_holds.holdee_id
      AND availability_holds.status = 'pending'
    )
  )
  WITH CHECK (
    status IN ('accepted', 'declined') AND
    responded_at IS NOT NULL
  );

-- Requesters can cancel their own pending holds
CREATE POLICY "Requesters can cancel their holds"
  ON public.availability_holds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = availability_holds.requester_id
      AND availability_holds.status = 'pending'
    )
  )
  WITH CHECK (status = 'cancelled');

-- Admins can view and manage all holds
CREATE POLICY "Admins can manage all holds"
  ON public.availability_holds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- Triggers and Functions
-- =====================================================

-- Function to auto-expire holds after 48 hours
CREATE OR REPLACE FUNCTION public.expire_pending_holds()
RETURNS void AS $$
BEGIN
  UPDATE public.availability_holds
  SET
    status = 'expired',
    updated_at = now()
  WHERE
    status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_availability_hold_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on hold updates
CREATE TRIGGER update_availability_hold_timestamp
  BEFORE UPDATE ON public.availability_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_availability_hold_timestamp();

-- Function to prevent accepting overlapping holds
CREATE OR REPLACE FUNCTION public.check_hold_conflicts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when accepting a hold
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check for other accepted holds that overlap
    IF EXISTS (
      SELECT 1 FROM public.availability_holds
      WHERE
        id != NEW.id
        AND holdee_id = NEW.holdee_id
        AND holdee_type = NEW.holdee_type
        AND status = 'accepted'
        AND (
          (start_date <= NEW.end_date AND end_date >= NEW.start_date)
        )
    ) THEN
      RAISE EXCEPTION 'Cannot accept hold: conflicts with existing accepted hold';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check conflicts before accepting holds
CREATE TRIGGER check_hold_conflicts
  BEFORE UPDATE ON public.availability_holds
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.check_hold_conflicts();

-- Function to log hold actions to audit_logs
CREATE OR REPLACE FUNCTION public.log_hold_actions()
RETURNS TRIGGER AS $$
BEGIN
  -- Log hold creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      occurred_at
    ) VALUES (
      (SELECT id FROM public.profiles WHERE organization_id = NEW.requester_id LIMIT 1),
      'hold_created',
      'availability_hold',
      NEW.id,
      jsonb_build_object(
        'holdee_id', NEW.holdee_id,
        'holdee_type', NEW.holdee_type,
        'requester_id', NEW.requester_id,
        'start_date', NEW.start_date,
        'end_date', NEW.end_date
      ),
      now()
    );
  END IF;

  -- Log hold status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      occurred_at
    ) VALUES (
      auth.uid(),
      CASE NEW.status
        WHEN 'accepted' THEN 'hold_accepted'
        WHEN 'declined' THEN 'hold_declined'
        WHEN 'cancelled' THEN 'hold_cancelled'
        WHEN 'expired' THEN 'hold_expired'
        ELSE 'hold_status_changed'
      END,
      'availability_hold',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'holdee_id', NEW.holdee_id,
        'requester_id', NEW.requester_id
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log hold actions
CREATE TRIGGER log_hold_actions
  AFTER INSERT OR UPDATE ON public.availability_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.log_hold_actions();

-- =====================================================
-- Helper Views
-- =====================================================

-- View for active holds (pending or accepted)
CREATE OR REPLACE VIEW public.active_holds AS
SELECT
  h.*,
  p.full_name as holdee_name,
  a.name as requester_name
FROM public.availability_holds h
LEFT JOIN public.profiles p ON p.id = h.holdee_id
LEFT JOIN public.agencies a ON a.id = h.requester_id
WHERE h.status IN ('pending', 'accepted')
ORDER BY h.created_at DESC;

COMMENT ON VIEW public.active_holds IS 'Active holds (pending or accepted) with holdee and requester names';

-- Grant permissions on view
GRANT SELECT ON public.active_holds TO authenticated;
