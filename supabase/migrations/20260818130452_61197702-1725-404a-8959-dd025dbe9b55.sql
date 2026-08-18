CREATE TABLE public.emergency_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid REFERENCES public.emergencies(id) ON DELETE SET NULL,
  emergency_code text NOT NULL DEFAULT '',
  reporter_id uuid NOT NULL,
  reporter_role rc_role NOT NULL DEFAULT 'doctor',
  reported_user_id uuid,
  reason text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'SUBMITTED',
  review_result text,
  resolution text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.emergency_reports TO authenticated;
GRANT ALL ON public.emergency_reports TO service_role;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_read_authenticated ON public.emergency_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY reports_insert_own ON public.emergency_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY reports_update_own ON public.emergency_reports FOR UPDATE TO authenticated USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

CREATE TABLE public.reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  points integer NOT NULL,
  kind text NOT NULL DEFAULT 'EARN',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reward_transactions TO authenticated;
GRANT ALL ON public.reward_transactions TO service_role;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_tx_read_own ON public.reward_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY reward_tx_insert_own ON public.reward_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.redeemed_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id text NOT NULL,
  name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  cost integer NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.redeemed_rewards TO authenticated;
GRANT ALL ON public.redeemed_rewards TO service_role;
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY redeemed_read_own ON public.redeemed_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY redeemed_insert_own ON public.redeemed_rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_reward_tx_user ON public.reward_transactions(user_id, created_at DESC);
CREATE INDEX idx_redeemed_user ON public.redeemed_rewards(user_id, created_at DESC);
CREATE INDEX idx_reports_reported_user ON public.emergency_reports(reported_user_id);
CREATE INDEX idx_emergencies_passenger ON public.emergencies(passenger_id, created_at DESC);