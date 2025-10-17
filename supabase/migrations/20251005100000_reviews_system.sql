-- Reviews system for guide ratings and feedback
-- Agencies/DMCs can rate guides, guides can rate agencies

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('guide', 'agency', 'dmc', 'transport')),
  reviewee_type TEXT NOT NULL CHECK (reviewee_type IN ('guide', 'agency', 'dmc', 'transport')),

  -- Rating fields (1-5 scale)
  -- For agencies rating guides
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),

  -- For guides rating agencies
  payment_speed_rating INTEGER CHECK (payment_speed_rating >= 1 AND payment_speed_rating <= 5),
  trust_rating INTEGER CHECK (trust_rating >= 1 AND trust_rating <= 5),
  clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  support_rating INTEGER CHECK (support_rating >= 1 AND support_rating <= 5),

  -- Overall rating (required)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),

  -- Text content
  title TEXT NOT NULL,
  comment TEXT NOT NULL,

  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reported')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES public.profiles(id),
  moderated_at TIMESTAMPTZ,

  -- Report tracking
  reported_at TIMESTAMPTZ,
  reported_by UUID REFERENCES public.profiles(id),
  report_reason TEXT,

  -- Metadata
  job_reference TEXT, -- Optional reference to related job
  booking_reference TEXT, -- Optional reference to related booking
  locale TEXT DEFAULT 'en',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT reviews_reviewer_not_reviewee CHECK (reviewer_id != reviewee_id),
  CONSTRAINT reviews_valid_direction CHECK (
    (reviewer_type IN ('agency', 'dmc', 'transport') AND reviewee_type = 'guide') OR
    (reviewer_type = 'guide' AND reviewee_type IN ('agency', 'dmc', 'transport'))
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_overall_rating ON public.reviews(overall_rating);
CREATE INDEX idx_reviews_reviewee_status ON public.reviews(reviewee_id, status) WHERE status = 'approved';

-- Create aggregate ratings view for profiles
CREATE OR REPLACE VIEW public.profile_ratings AS
SELECT
  reviewee_id,
  COUNT(*) FILTER (WHERE status = 'approved') as total_reviews,
  ROUND(AVG(overall_rating) FILTER (WHERE status = 'approved'), 2) as avg_overall_rating,

  -- For guides (rated by agencies)
  ROUND(AVG(service_rating) FILTER (WHERE status = 'approved' AND service_rating IS NOT NULL), 2) as avg_service_rating,
  ROUND(AVG(communication_rating) FILTER (WHERE status = 'approved' AND communication_rating IS NOT NULL), 2) as avg_communication_rating,
  ROUND(AVG(value_rating) FILTER (WHERE status = 'approved' AND value_rating IS NOT NULL), 2) as avg_value_rating,
  ROUND(AVG(professionalism_rating) FILTER (WHERE status = 'approved' AND professionalism_rating IS NOT NULL), 2) as avg_professionalism_rating,

  -- For agencies (rated by guides)
  ROUND(AVG(payment_speed_rating) FILTER (WHERE status = 'approved' AND payment_speed_rating IS NOT NULL), 2) as avg_payment_speed_rating,
  ROUND(AVG(trust_rating) FILTER (WHERE status = 'approved' AND trust_rating IS NOT NULL), 2) as avg_trust_rating,
  ROUND(AVG(clarity_rating) FILTER (WHERE status = 'approved' AND clarity_rating IS NOT NULL), 2) as avg_clarity_rating,
  ROUND(AVG(support_rating) FILTER (WHERE status = 'approved' AND support_rating IS NOT NULL), 2) as avg_support_rating,

  -- Most recent review
  MAX(created_at) FILTER (WHERE status = 'approved') as latest_review_date
FROM public.reviews
GROUP BY reviewee_id;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved');

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view their own reviews"
  ON public.reviews
  FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Users can update their own pending reviews
CREATE POLICY "Users can update their own pending reviews"
  ON public.reviews
  FOR UPDATE
  USING (reviewer_id = auth.uid() AND status = 'pending')
  WITH CHECK (reviewer_id = auth.uid() AND status = 'pending');

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update reviews (for moderation)
CREATE POLICY "Admins can moderate reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();

-- Create function to log review moderation actions
CREATE OR REPLACE FUNCTION public.log_review_moderation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to audit_logs when review is moderated
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      occurred_at
    ) VALUES (
      NEW.moderated_by,
      CASE NEW.status
        WHEN 'approved' THEN 'review_approved'
        WHEN 'rejected' THEN 'review_rejected'
        ELSE 'review_moderated'
      END,
      'review',
      NEW.id,
      jsonb_build_object(
        'reviewer_id', NEW.reviewer_id,
        'reviewee_id', NEW.reviewee_id,
        'overall_rating', NEW.overall_rating,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'moderation_notes', NEW.moderation_notes
      ),
      now()
    );
  END IF;

  -- Log when review is reported
  IF (TG_OP = 'UPDATE' AND OLD.status != 'reported' AND NEW.status = 'reported') THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      occurred_at
    ) VALUES (
      NEW.reported_by,
      'review_reported',
      'review',
      NEW.id,
      jsonb_build_object(
        'reviewer_id', NEW.reviewer_id,
        'reviewee_id', NEW.reviewee_id,
        'report_reason', NEW.report_reason
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review moderation logging
DROP TRIGGER IF EXISTS reviews_moderation_audit ON public.reviews;
CREATE TRIGGER reviews_moderation_audit
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_review_moderation();

-- Grant permissions
GRANT SELECT ON public.profile_ratings TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;

-- Comments
COMMENT ON TABLE public.reviews IS 'Reviews and ratings between guides and agencies/DMCs';
COMMENT ON COLUMN public.reviews.service_rating IS 'Guide service quality (agencies rating guides)';
COMMENT ON COLUMN public.reviews.payment_speed_rating IS 'Agency payment speed (guides rating agencies)';
COMMENT ON COLUMN public.reviews.status IS 'Moderation status: pending, approved, rejected, reported';
COMMENT ON VIEW public.profile_ratings IS 'Aggregated rating statistics for each profile';
