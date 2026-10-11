ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS commission_enabled boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.guard_commission_flag() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.commission_enabled IS DISTINCT FROM OLD.commission_enabled
     AND auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change commission';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_commission_flag ON public.restaurants;
CREATE TRIGGER trg_guard_commission_flag BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.guard_commission_flag();

CREATE OR REPLACE FUNCTION public.guard_commission_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.commission_enabled := true;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_commission_insert ON public.restaurants;
CREATE TRIGGER trg_guard_commission_insert BEFORE INSERT ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.guard_commission_insert();

CREATE OR REPLACE FUNCTION public.notify_new_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner_id uuid;
BEGIN
  SELECT owner_id INTO _owner_id FROM restaurants WHERE id = NEW.restaurant_id;
  IF _owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (_owner_id, 'New Order!', 'New paid order worth ₹' || NEW.total_amount::text || ' received. Tap to accept.', 'order', '/restaurant/orders');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_order_status_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _title text; _message text; _restaurant_name text; _owner_id uuid; _mtype text; _comm_on boolean;
  _item_total numeric; _platform_fee numeric := 3; _commission numeric; _restaurant_credit numeric;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT name, owner_id, merchant_type::text, commission_enabled INTO _restaurant_name, _owner_id, _mtype, _comm_on
    FROM restaurants WHERE id = NEW.restaurant_id;
  IF NEW.customer_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'accepted' THEN _title := 'Order Accepted'; _message := _restaurant_name || ' accepted your order!';
      WHEN 'preparing' THEN
        IF _mtype = 'grocery' THEN _title := 'Packing Your Order'; _message := _restaurant_name || ' is picking & packing your order.';
        ELSE _title := 'Preparing Your Food'; _message := _restaurant_name || ' is preparing your order.'; END IF;
      WHEN 'ready_for_pickup' THEN _title := 'Ready for Pickup'; _message := 'Your order at ' || _restaurant_name || ' is ready! Head over to pick it up.';
      WHEN 'completed' THEN
        _item_total := GREATEST(NEW.total_amount - _platform_fee, 0);
        _title := 'Order Complete';
        _message := 'Order complete! You earned ' || ROUND(_item_total * 0.03, 0)::text || ' points.';
      WHEN 'cancelled' THEN _title := 'Order Cancelled'; _message := 'Your order at ' || _restaurant_name || ' was cancelled.';
      ELSE NULL;
    END CASE;
    IF _title IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (NEW.customer_id, _title, _message, CASE WHEN NEW.status = 'cancelled' THEN 'error' ELSE 'order' END, '/customer/orders/' || NEW.id);
    END IF;
  END IF;
  IF _owner_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'placed' THEN
        IF OLD.status = 'pending_payment' THEN
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (_owner_id, 'New Order!', 'New paid order worth ₹' || NEW.total_amount::text || ' received. Tap to accept.', 'order', '/restaurant/orders');
        END IF;
      WHEN 'completed' THEN
        _item_total := GREATEST(NEW.total_amount - _platform_fee, 0);
        _commission := CASE WHEN coalesce(_comm_on, true) THEN ROUND(_item_total * 0.05, 2) ELSE 0 END;
        _restaurant_credit := _item_total - _commission;
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Completed', 'Order complete. ₹' || _restaurant_credit::text || ' credited' ||
          CASE WHEN _commission > 0 THEN ' (5% commission: ₹' || _commission::text || ').' ELSE ' (no commission).' END, 'earning', '/restaurant/orders');
      WHEN 'cancelled' THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Cancelled', 'An order was cancelled.', 'error', '/restaurant/orders');
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_pickup_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.restaurants%ROWTYPE;
  _count bigint; _load bigint; _buf int;
BEGIN
  SELECT * INTO r FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Restaurant not found'; END IF;
  IF r.orders_paused_indefinitely OR (r.orders_paused_until IS NOT NULL AND r.orders_paused_until > now()) THEN
    RAISE EXCEPTION 'Restaurant is not accepting orders right now';
  END IF;
  NEW.prep_minutes := LEAST(GREATEST(coalesce(NEW.prep_minutes, 10), 0), 240);
  _buf := CASE WHEN NEW.prep_minutes = 0 THEN 0 ELSE r.preparation_buffer_minutes END;
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
    NEW.prep_start_at := NEW.pickup_time - make_interval(mins => NEW.prep_minutes + _buf);
  END IF;
  RETURN NEW;
END; $$;