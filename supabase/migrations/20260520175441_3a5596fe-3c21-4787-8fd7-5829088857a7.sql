-- ============================================================
-- 1. PRIVATE PHONE NUMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_contact_info (
  user_id uuid PRIMARY KEY,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_contact_info ENABLE ROW LEVEL SECURITY;

-- Backfill from profiles
INSERT INTO public.user_contact_info (user_id, phone)
SELECT id, phone FROM public.profiles
WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

CREATE POLICY "Users manage own contact"
ON public.user_contact_info FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all contact"
ON public.user_contact_info FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER user_contact_info_updated_at
BEFORE UPDATE ON public.user_contact_info
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to fetch a customer's phone for a restaurant owner who has an order from them
CREATE OR REPLACE FUNCTION public.get_customer_phone_for_owner(_customer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uci.phone
  FROM public.user_contact_info uci
  WHERE uci.user_id = _customer_id
    AND (
      auth.uid() = _customer_id
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.restaurants r ON r.id = o.restaurant_id
        WHERE o.customer_id = _customer_id
          AND r.owner_id = auth.uid()
      )
    );
$$;

-- Drop phone from public profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- Update signup trigger to write phone into private table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, name, city, state, campus)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'state',
    NEW.raw_user_meta_data ->> 'area'
  );

  IF (NEW.raw_user_meta_data ->> 'phone') IS NOT NULL THEN
    INSERT INTO public.user_contact_info (user_id, phone)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'phone')
    ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone;
  END IF;

  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. PRIVATE RESTAURANT COMPLIANCE FIELDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurant_compliance (
  restaurant_id uuid PRIMARY KEY,
  fssai_license text,
  gst_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_compliance ENABLE ROW LEVEL SECURITY;

-- Backfill
INSERT INTO public.restaurant_compliance (restaurant_id, fssai_license, gst_number)
SELECT id, fssai_license, gst_number FROM public.restaurants
WHERE fssai_license IS NOT NULL OR gst_number IS NOT NULL
ON CONFLICT (restaurant_id) DO NOTHING;

CREATE POLICY "Owners manage own compliance"
ON public.restaurant_compliance FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "Admins manage all compliance"
ON public.restaurant_compliance FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER restaurant_compliance_updated_at
BEFORE UPDATE ON public.restaurant_compliance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop sensitive columns from public restaurants
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS fssai_license;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS gst_number;

-- ============================================================
-- 3. COIN TRANSACTIONS — REMOVE USER INSERT POLICY
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.coin_transactions;

-- Lock down direct user_wallet updates by users (now only triggers/admin/transfer_coins definer can change)
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallet;

-- ============================================================
-- 4. MENU-IMAGES STORAGE BUCKET — RESTRICT TO RESTAURANT OWNERS
-- ============================================================
DROP POLICY IF EXISTS "Anyone can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Menu image uploads" ON storage.objects;

CREATE POLICY "Restaurant owners can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.owner_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
  )
);

CREATE POLICY "Restaurant owners can update own menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.owner_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
  )
);

CREATE POLICY "Restaurant owners can delete own menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.owner_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
  )
);