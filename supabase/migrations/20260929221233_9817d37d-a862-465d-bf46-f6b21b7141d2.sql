ALTER TABLE public.city_interests
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS area_label text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.city_interests DROP CONSTRAINT IF EXISTS city_interests_user_id_city_key;
ALTER TABLE public.city_interests ADD CONSTRAINT city_interests_user_city_cat_key UNIQUE (user_id, city, category);

CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  house text NOT NULL,
  area text,
  landmark text,
  receiver_name text,
  receiver_phone text,
  city text,
  formatted text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addresses TO authenticated;
GRANT ALL ON public.user_addresses TO service_role;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.user_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_outlet_owner_name(_restaurant_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.name FROM public.restaurants r JOIN public.profiles p ON p.id = r.owner_id
  WHERE r.id = _restaurant_id AND r.is_active = true
$$;
REVOKE ALL ON FUNCTION public.get_outlet_owner_name(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_outlet_owner_name(uuid) TO anon, authenticated;