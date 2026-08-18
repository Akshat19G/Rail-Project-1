CREATE TYPE public.rc_role AS ENUM ('passenger','doctor','hospital','control');
CREATE TYPE public.rc_priority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  role public.rc_role NOT NULL DEFAULT 'passenger',
  full_name text NOT NULL DEFAULT '',
  mobile text,
  email text,
  age integer,
  blood_group text,
  emergency_contact text,
  allergies text,
  specialization text,
  is_responder boolean NOT NULL DEFAULT false,
  trust_score integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role public.rc_role NOT NULL DEFAULT 'passenger',
  train_id text NOT NULL DEFAULT 'RC2047',
  train_name text NOT NULL DEFAULT 'RC Express 2047',
  from_station text NOT NULL DEFAULT 'Pune Central',
  to_station text NOT NULL DEFAULT 'Mumbai Central',
  coach text NOT NULL DEFAULT 'B2',
  seat text NOT NULL DEFAULT '1',
  travel_date date NOT NULL DEFAULT current_date,
  available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journeys TO authenticated;
GRANT ALL ON public.journeys TO service_role;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journeys_read_authenticated" ON public.journeys FOR SELECT TO authenticated USING (true);
CREATE POLICY "journeys_insert_own" ON public.journeys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journeys_update_own" ON public.journeys FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journeys_delete_own" ON public.journeys FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.emergencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  passenger_id uuid NOT NULL,
  passenger_name text NOT NULL DEFAULT '',
  passenger_age integer,
  blood_group text,
  emergency_contact text,
  train_id text NOT NULL DEFAULT 'RC2047',
  coach text NOT NULL DEFAULT 'B2',
  seat text NOT NULL DEFAULT '1',
  current_station text NOT NULL DEFAULT 'Pune Central',
  emergency_type text NOT NULL DEFAULT 'Other',
  symptoms text NOT NULL DEFAULT '',
  priority public.rc_priority NOT NULL DEFAULT 'MEDIUM',
  triage_reason text,
  status text NOT NULL DEFAULT 'SOS_TRIGGERED',
  assigned_doctor_id uuid,
  assigned_doctor_name text,
  doctor_specialization text,
  doctor_coach text,
  doctor_distance integer,
  assessment text,
  escalated boolean NOT NULL DEFAULT false,
  hospital_name text,
  hospital_station text,
  hospital_contact text,
  hospital_notified boolean NOT NULL DEFAULT false,
  ambulance_id text,
  ambulance_status text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergencies TO authenticated;
GRANT ALL ON public.emergencies TO service_role;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergencies_read_authenticated" ON public.emergencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "emergencies_insert_own" ON public.emergencies FOR INSERT TO authenticated WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "emergencies_update_authenticated" ON public.emergencies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.emergency_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL DEFAULT 'System',
  detail text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.emergency_events TO authenticated;
GRANT ALL ON public.emergency_events TO service_role;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read_authenticated" ON public.emergency_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert_authenticated" ON public.emergency_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  station text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'Government Hospital',
  contact text NOT NULL DEFAULT 'DEMO CONTACT',
  address text NOT NULL DEFAULT '',
  ambulance_id text NOT NULL DEFAULT 'RC-AMB-00',
  ambulance_available boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'Emergency Services Available',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospitals_read_authenticated" ON public.hospitals FOR SELECT TO authenticated USING (true);

INSERT INTO public.hospitals (name, station, contact, address, ambulance_id) VALUES
 ('Pune Government Hospital','Pune Central','DEMO CONTACT · 000-DEMO-01','Station Road, Pune (simulated)','RC-AMB-01'),
 ('Talegaon Government Hospital','Talegaon','DEMO CONTACT · 000-DEMO-02','Talegaon Dabhade (simulated)','RC-AMB-02'),
 ('Lonavala Government Hospital','Lonavala','DEMO CONTACT · 000-DEMO-03','Lonavala Station Road (simulated)','RC-AMB-03'),
 ('Karjat Government Hospital','Karjat','DEMO CONTACT · 000-DEMO-04','Karjat Junction (simulated)','RC-AMB-04'),
 ('Kalyan Government Hospital','Kalyan','DEMO CONTACT · 000-DEMO-05','Kalyan West (simulated)','RC-AMB-05'),
 ('Thane Government Hospital','Thane','DEMO CONTACT · 000-DEMO-06','Thane East (simulated)','RC-AMB-06'),
 ('Mumbai Government Hospital','Mumbai Central','DEMO CONTACT · 000-DEMO-07','Mumbai Central (simulated)','RC-AMB-07');

CREATE TABLE public.train_state (
  train_id text PRIMARY KEY,
  train_name text NOT NULL DEFAULT 'RC Express 2047',
  current_station_index integer NOT NULL DEFAULT 0,
  journey_status text NOT NULL DEFAULT 'IDLE',
  running boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.train_state TO authenticated;
GRANT ALL ON public.train_state TO service_role;
ALTER TABLE public.train_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "train_read_authenticated" ON public.train_state FOR SELECT TO authenticated USING (true);
CREATE POLICY "train_update_authenticated" ON public.train_state FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.train_state (train_id) VALUES ('RC2047');

CREATE OR REPLACE FUNCTION public.rc_touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.rc_touch_updated_at();
CREATE TRIGGER trg_journeys_touch BEFORE UPDATE ON public.journeys FOR EACH ROW EXECUTE FUNCTION public.rc_touch_updated_at();
CREATE TRIGGER trg_emergencies_touch BEFORE UPDATE ON public.emergencies FOR EACH ROW EXECUTE FUNCTION public.rc_touch_updated_at();
CREATE TRIGGER trg_train_touch BEFORE UPDATE ON public.train_state FOR EACH ROW EXECUTE FUNCTION public.rc_touch_updated_at();

ALTER TABLE public.emergencies REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_events REPLICA IDENTITY FULL;
ALTER TABLE public.journeys REPLICA IDENTITY FULL;
ALTER TABLE public.train_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journeys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.train_state;