-- Outlet code
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS outlet_code text;

CREATE OR REPLACE FUNCTION public.generate_outlet_code(_name text)
RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _prefix text; _code text;
BEGIN
  _prefix := upper(left(regexp_replace(coalesce(_name,''), '[^A-Za-z0-9]', '', 'g'), 4));
  IF length(_prefix) < 2 THEN _prefix := 'MUN'; END IF;
  LOOP
    _code := _prefix || lpad(((('x' || encode(extensions.gen_random_bytes(2), 'hex'))::bit(16)::int) % 10000)::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.restaurants WHERE outlet_code = _code);
  END LOOP;
  RETURN _code;
END $$;

UPDATE public.restaurants SET outlet_code = public.generate_outlet_code(name) WHERE outlet_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_outlet_code_key ON public.restaurants (outlet_code);

CREATE OR REPLACE FUNCTION public.set_outlet_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.outlet_code := public.generate_outlet_code(NEW.name);
  ELSE
    NEW.outlet_code := OLD.outlet_code;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_set_outlet_code BEFORE INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_outlet_code();
REVOKE EXECUTE ON FUNCTION public.set_outlet_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_outlet_code(text) FROM PUBLIC, anon, authenticated;

-- Staff table
CREATE TABLE public.restaurant_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  username text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX restaurant_staff_username_key ON public.restaurant_staff (restaurant_id, lower(username));
GRANT SELECT ON public.restaurant_staff TO authenticated;
GRANT ALL ON public.restaurant_staff TO service_role;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view their staff" ON public.restaurant_staff FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
CREATE POLICY "Staff view own row" ON public.restaurant_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_active);
CREATE POLICY "Admins view staff" ON public.restaurant_staff FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_restaurant_staff_updated_at BEFORE UPDATE ON public.restaurant_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_restaurant_staff(_restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_staff s
    WHERE s.restaurant_id = _restaurant_id AND s.user_id = auth.uid() AND s.is_active)
$$;

CREATE OR REPLACE FUNCTION public.get_staff_outlet()
RETURNS TABLE(id uuid, name text, merchant_type text, staff_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.id, r.name, r.merchant_type::text, s.name FROM public.restaurant_staff s
  JOIN public.restaurants r ON r.id = s.restaurant_id
  WHERE s.user_id = auth.uid() AND s.is_active LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.get_staff_outlet() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_restaurant_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_outlet() TO authenticated;

-- Staff access to orders
CREATE POLICY "Staff view outlet orders" ON public.orders FOR SELECT TO authenticated
  USING (public.is_restaurant_staff(restaurant_id));
CREATE POLICY "Staff update outlet orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_restaurant_staff(restaurant_id)) WITH CHECK (public.is_restaurant_staff(restaurant_id));
CREATE POLICY "Staff view outlet order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_restaurant_staff(o.restaurant_id)));

-- Staff may only accept, reject, prepare and mark ready
CREATE OR REPLACE FUNCTION public.guard_staff_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = NEW.restaurant_id AND r.owner_id = auth.uid())
     OR has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF public.is_restaurant_staff(NEW.restaurant_id) THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
      (OLD.status = 'placed' AND NEW.status IN ('accepted','cancelled'))
      OR (OLD.status IN ('accepted','preparing') AND NEW.status IN ('preparing','ready_for_pickup'))
    ) THEN
      RAISE EXCEPTION 'Staff cannot make this change';
    END IF;
    IF NEW.pickup_time IS DISTINCT FROM OLD.pickup_time OR NEW.prep_minutes IS DISTINCT FROM OLD.prep_minutes THEN
      RAISE EXCEPTION 'Staff cannot make this change';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_staff_order_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_staff_order_update();
REVOKE EXECUTE ON FUNCTION public.guard_staff_order_update() FROM PUBLIC, anon, authenticated;

-- Sign-up can only self-assign customer or restaurant roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, name, city, state, campus)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'city', NEW.raw_user_meta_data ->> 'state', NEW.raw_user_meta_data ->> 'area');
  IF (NEW.raw_user_meta_data ->> 'phone') IS NOT NULL THEN
    INSERT INTO public.user_contact_info (user_id, phone) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'phone')
    ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone;
  END IF;
  _role := CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'restaurant' THEN 'restaurant'::app_role ELSE 'customer'::app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;