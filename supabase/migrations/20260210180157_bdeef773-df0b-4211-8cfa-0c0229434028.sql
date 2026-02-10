
-- Add city column to restaurants
ALTER TABLE public.restaurants ADD COLUMN city text;

-- Create city_interests table for "notify me" feature
CREATE TABLE public.city_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  city text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, city)
);

ALTER TABLE public.city_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own interest"
ON public.city_interests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interests"
ON public.city_interests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interests"
ON public.city_interests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
