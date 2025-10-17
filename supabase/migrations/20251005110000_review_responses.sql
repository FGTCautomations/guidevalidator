-- Review responses table
CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,

  -- Only allow one response per review
  CONSTRAINT review_responses_unique_review UNIQUE(review_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON public.review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_responder_id ON public.review_responses(responder_id);

-- RLS policies
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read responses for approved reviews
CREATE POLICY "Anyone can read responses for approved reviews"
  ON public.review_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_responses.review_id
      AND reviews.status = 'approved'
    )
  );

-- Reviewees can create responses to their reviews
CREATE POLICY "Reviewees can create responses"
  ON public.review_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_responses.review_id
      AND reviews.reviewee_id = responder_id
      AND reviews.status = 'approved'
    )
  );

-- Responders can update their own responses
CREATE POLICY "Responders can update own responses"
  ON public.review_responses
  FOR UPDATE
  USING (responder_id = auth.uid())
  WITH CHECK (responder_id = auth.uid());

-- Admins can manage all responses
CREATE POLICY "Admins can manage responses"
  ON public.review_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_review_response_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_review_response_updated_at
  BEFORE UPDATE ON public.review_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_response_updated_at();
