CREATE TABLE public.pulse_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id uuid NOT NULL REFERENCES public.pulses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pulse_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.pulse_likes TO authenticated;
GRANT ALL ON public.pulse_likes TO service_role;

ALTER TABLE public.pulse_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can like pulses"
ON public.pulse_likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike their own like"
ON public.pulse_likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Likes visible to pulse owner and liker"
ON public.pulse_likes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.pulses p WHERE p.id = pulse_likes.pulse_id AND p.user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_likes;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
ON public.profiles (lower(username)) WHERE username IS NOT NULL;