-- Add abuse reports table for chat moderation

CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS abuse_reports_reporter_idx ON public.abuse_reports(reporter_id);
CREATE INDEX IF NOT EXISTS abuse_reports_reported_user_idx ON public.abuse_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS abuse_reports_conversation_idx ON public.abuse_reports(conversation_id);
CREATE INDEX IF NOT EXISTS abuse_reports_status_idx ON public.abuse_reports(status);
CREATE INDEX IF NOT EXISTS abuse_reports_created_at_idx ON public.abuse_reports(created_at DESC);

-- Updated_at trigger
SELECT public.ensure_trigger(
  'public',
  'abuse_reports',
  'abuse_reports_touch_updated_at',
  $SQL$
  CREATE TRIGGER abuse_reports_touch_updated_at
    BEFORE UPDATE ON public.abuse_reports
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

-- Enable RLS
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own reports
DROP POLICY IF EXISTS "abuse_reports_select_own" ON public.abuse_reports;
CREATE POLICY "abuse_reports_select_own" ON public.abuse_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Users can create reports
DROP POLICY IF EXISTS "abuse_reports_insert" ON public.abuse_reports;
CREATE POLICY "abuse_reports_insert" ON public.abuse_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Admins can view and manage all reports
DROP POLICY IF EXISTS "abuse_reports_admin_all" ON public.abuse_reports;
CREATE POLICY "abuse_reports_admin_all" ON public.abuse_reports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Add strikes table for tracking user violations
CREATE TABLE IF NOT EXISTS public.user_strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  abuse_report_id uuid REFERENCES public.abuse_reports(id) ON DELETE SET NULL,
  issued_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for strikes
CREATE INDEX IF NOT EXISTS user_strikes_user_idx ON public.user_strikes(user_id);
CREATE INDEX IF NOT EXISTS user_strikes_created_at_idx ON public.user_strikes(created_at DESC);
CREATE INDEX IF NOT EXISTS user_strikes_expires_at_idx ON public.user_strikes(expires_at);

-- Enable RLS on strikes
ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;

-- Admins can manage strikes
DROP POLICY IF EXISTS "user_strikes_admin_all" ON public.user_strikes;
CREATE POLICY "user_strikes_admin_all" ON public.user_strikes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Users can view their own active strikes
DROP POLICY IF EXISTS "user_strikes_select_own" ON public.user_strikes;
CREATE POLICY "user_strikes_select_own" ON public.user_strikes
  FOR SELECT USING (
    user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  );
