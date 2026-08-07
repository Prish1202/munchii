-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.pulse_media_type AS ENUM ('image', 'video', 'text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.club_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PULSES
CREATE TABLE public.pulses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_type public.pulse_media_type NOT NULL,
  media_url text,
  text_content text,
  background_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulses TO authenticated;
GRANT ALL ON public.pulses TO service_role;

ALTER TABLE public.pulses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active pulses"
  ON public.pulses FOR SELECT TO authenticated
  USING (expires_at > now() AND NOT public.is_blocked_between(auth.uid(), user_id));

CREATE POLICY "Users can create their own pulses"
  ON public.pulses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pulses"
  ON public.pulses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pulses"
  ON public.pulses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_pulses_expires_at ON public.pulses (expires_at DESC);
CREATE INDEX idx_pulses_user_id ON public.pulses (user_id);

-- PULSE VIEWS
CREATE TABLE public.pulse_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id uuid NOT NULL REFERENCES public.pulses(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pulse_id, viewer_id)
);

GRANT SELECT, INSERT ON public.pulse_views TO authenticated;
GRANT ALL ON public.pulse_views TO service_role;

ALTER TABLE public.pulse_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner and viewer can see pulse views"
  ON public.pulse_views FOR SELECT TO authenticated
  USING (
    viewer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pulses p WHERE p.id = pulse_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Users can record their own views"
  ON public.pulse_views FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid());

-- CLUBS
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  city text,
  cover_url text,
  is_private boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.club_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_members TO authenticated;
GRANT ALL ON public.club_members TO service_role;

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_club_admin(_club_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = _club_id AND user_id = _user_id AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_club_admin(uuid, uuid) FROM anon;

CREATE POLICY "Authenticated can view clubs"
  ON public.clubs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create clubs"
  ON public.clubs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Club admins can update clubs"
  ON public.clubs FOR UPDATE TO authenticated
  USING (public.is_club_admin(id, auth.uid()))
  WITH CHECK (public.is_club_admin(id, auth.uid()));

CREATE POLICY "Club admins can delete clubs"
  ON public.clubs FOR DELETE TO authenticated
  USING (public.is_club_admin(id, auth.uid()) OR created_by = auth.uid());

CREATE POLICY "Authenticated can view club members"
  ON public.club_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join clubs"
  ON public.club_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      role = 'member'
      OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can leave clubs or admins can remove members"
  ON public.club_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid()));

CREATE POLICY "Club admins can update members"
  ON public.club_members FOR UPDATE TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()))
  WITH CHECK (public.is_club_admin(club_id, auth.uid()));

CREATE INDEX idx_club_members_club_id ON public.club_members (club_id);
CREATE INDEX idx_club_members_user_id ON public.club_members (user_id);

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.pulses REPLICA IDENTITY FULL;
ALTER TABLE public.clubs REPLICA IDENTITY FULL;
ALTER TABLE public.club_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pulses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_members;