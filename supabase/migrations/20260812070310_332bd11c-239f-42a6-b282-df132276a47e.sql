CREATE OR REPLACE FUNCTION public.is_club_member(_club_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.club_members WHERE club_id = _club_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(_club_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.club_members WHERE club_id = _club_id AND user_id = _user_id AND role = 'admin');
$$;

CREATE TABLE public.club_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text,
  media_name text,
  media_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_messages TO authenticated;
GRANT ALL ON public.club_messages TO service_role;

ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read club messages"
ON public.club_messages FOR SELECT TO authenticated
USING (public.is_club_member(club_id, auth.uid()));

CREATE POLICY "Members can post club messages"
ON public.club_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_club_member(club_id, auth.uid()));

CREATE POLICY "Authors can edit own club messages"
ON public.club_messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Authors or club admins can delete club messages"
ON public.club_messages FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR public.is_club_admin(club_id, auth.uid()));

CREATE INDEX idx_club_messages_club_created ON public.club_messages(club_id, created_at);

CREATE TRIGGER update_club_messages_updated_at
BEFORE UPDATE ON public.club_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.club_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;