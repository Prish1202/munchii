
-- Add pickup_otp column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_otp text;

-- Create abuse_reports table
CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_message_id uuid,
  report_type text NOT NULL DEFAULT 'other',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can submit reports" ON public.abuse_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.abuse_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports" ON public.abuse_reports
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for abuse_reports
CREATE TRIGGER update_abuse_reports_updated_at
  BEFORE UPDATE ON public.abuse_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
