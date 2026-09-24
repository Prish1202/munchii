ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS pickup_slot_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_orders_per_slot integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_workload_per_slot integer NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS min_advance_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_advance_minutes integer NOT NULL DEFAULT 480,
  ADD COLUMN IF NOT EXISTS orders_paused_until timestamptz,
  ADD COLUMN IF NOT EXISTS orders_paused_indefinitely boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS prep_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS prep_start_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_slot_usage(_restaurant_id uuid, _from timestamptz, _to timestamptz)
RETURNS TABLE(slot_start timestamptz, order_count bigint, workload bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.pickup_time, count(*), coalesce(sum(o.prep_minutes),0)
  FROM public.orders o
  WHERE o.restaurant_id = _restaurant_id
    AND o.pickup_time >= _from AND o.pickup_time <= _to
    AND o.status <> 'cancelled'
    AND NOT (o.status = 'pending_payment' AND o.created_at < now() - interval '15 minutes')
    AND NOT EXISTS (SELECT 1 FROM public.refunds r WHERE r.order_id = o.id)
  GROUP BY o.pickup_time;
$$;
GRANT EXECUTE ON FUNCTION public.get_slot_usage(uuid, timestamptz, timestamptz) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.enforce_pickup_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.restaurants%ROWTYPE;
  _count bigint; _load bigint;
BEGIN
  SELECT * INTO r FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Restaurant not found'; END IF;
  IF r.orders_paused_indefinitely OR (r.orders_paused_until IS NOT NULL AND r.orders_paused_until > now()) THEN
    RAISE EXCEPTION 'Restaurant is not accepting orders right now';
  END IF;
  NEW.prep_minutes := LEAST(GREATEST(coalesce(NEW.prep_minutes, 10), 1), 240);
  IF NEW.pickup_time IS NOT NULL THEN
    IF NEW.pickup_time < now() + make_interval(mins => r.min_advance_minutes) - interval '2 minutes' THEN
      RAISE EXCEPTION 'Pickup time is too soon';
    END IF;
    IF NEW.pickup_time > now() + make_interval(mins => r.max_advance_minutes) + interval '15 minutes' THEN
      RAISE EXCEPTION 'Pickup time is too far ahead';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext(NEW.restaurant_id::text || NEW.pickup_time::text));
    SELECT coalesce(sum(order_count),0), coalesce(sum(workload),0) INTO _count, _load
      FROM public.get_slot_usage(NEW.restaurant_id, NEW.pickup_time, NEW.pickup_time);
    IF _count + 1 > r.max_orders_per_slot OR _load + NEW.prep_minutes > r.max_workload_per_slot THEN
      RAISE EXCEPTION 'SLOT_FULL: This pickup slot is full, please choose a later slot';
    END IF;
    NEW.prep_start_at := NEW.pickup_time - make_interval(mins => NEW.prep_minutes + r.preparation_buffer_minutes);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_enforce_pickup_capacity ON public.orders;
CREATE TRIGGER trg_enforce_pickup_capacity BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_pickup_capacity();

CREATE OR REPLACE FUNCTION public.enforce_item_available()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.menu_item_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.menu_items WHERE id = NEW.menu_item_id AND available = true
  ) THEN
    RAISE EXCEPTION 'An item in your cart is no longer available';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_enforce_item_available ON public.order_items;
CREATE TRIGGER trg_enforce_item_available BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_item_available();