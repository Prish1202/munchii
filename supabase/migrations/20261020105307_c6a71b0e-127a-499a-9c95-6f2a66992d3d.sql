CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE OR REPLACE FUNCTION private.is_restaurant_staff(_restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_staff s
    WHERE s.restaurant_id = _restaurant_id AND s.user_id = auth.uid() AND s.is_active)
$$;
REVOKE EXECUTE ON FUNCTION private.is_restaurant_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_restaurant_staff(uuid) TO authenticated;

DROP POLICY "Staff view outlet orders" ON public.orders;
DROP POLICY "Staff update outlet orders" ON public.orders;
DROP POLICY "Staff view outlet order items" ON public.order_items;
CREATE POLICY "Staff view outlet orders" ON public.orders FOR SELECT TO authenticated
  USING (private.is_restaurant_staff(restaurant_id));
CREATE POLICY "Staff update outlet orders" ON public.orders FOR UPDATE TO authenticated
  USING (private.is_restaurant_staff(restaurant_id)) WITH CHECK (private.is_restaurant_staff(restaurant_id));
CREATE POLICY "Staff view outlet order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND private.is_restaurant_staff(o.restaurant_id)));

CREATE OR REPLACE FUNCTION public.guard_staff_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = NEW.restaurant_id AND r.owner_id = auth.uid())
     OR has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF private.is_restaurant_staff(NEW.restaurant_id) THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
      (OLD.status = 'placed' AND NEW.status IN ('accepted','cancelled'))
      OR (OLD.status IN ('accepted','preparing') AND NEW.status IN ('preparing','ready_for_pickup'))
    ) THEN RAISE EXCEPTION 'Staff cannot make this change'; END IF;
    IF NEW.pickup_time IS DISTINCT FROM OLD.pickup_time OR NEW.prep_minutes IS DISTINCT FROM OLD.prep_minutes THEN
      RAISE EXCEPTION 'Staff cannot make this change';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP FUNCTION public.is_restaurant_staff(uuid);