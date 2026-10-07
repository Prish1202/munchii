CREATE OR REPLACE FUNCTION public.recalc_order_total(_order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _items numeric; _coins numeric;
BEGIN
  SELECT coalesce(sum(price_at_time * quantity), 0) INTO _items FROM public.order_items WHERE order_id = _order_id;
  SELECT coalesce(sum(coins), 0) INTO _coins FROM public.coin_transactions WHERE order_id = _order_id AND type = 'redeem';
  UPDATE public.orders SET total_amount = GREATEST(_items + 3 - _coins, 0) WHERE id = _order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.secure_order_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.total_amount := 3;
    NEW.payment_method := 'razorpay';
    NEW.status := 'pending_payment';
  END IF;
  NEW.pickup_otp := lpad((((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 9000) + 1000)::text, 4, '0');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_coins(_coins numeric, _order_id uuid DEFAULT NULL::uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user uuid := auth.uid();
  _balance numeric;
  _o public.orders%ROWTYPE;
  _items numeric; _already numeric;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _coins IS NULL OR _coins <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF _order_id IS NOT NULL THEN
    SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
    IF _o.id IS NULL OR _o.customer_id <> _user THEN RAISE EXCEPTION 'Order not found'; END IF;
    IF _o.status <> 'pending_payment' THEN RAISE EXCEPTION 'Order can no longer be changed'; END IF;
    SELECT coalesce(sum(price_at_time * quantity), 0) INTO _items FROM public.order_items WHERE order_id = _order_id;
    SELECT coalesce(sum(coins), 0) INTO _already FROM public.coin_transactions WHERE order_id = _order_id AND type = 'redeem';
    IF _already + _coins > floor((_items + 3) * 0.5) THEN RAISE EXCEPTION 'Too many coins for this order'; END IF;
  END IF;
  PERFORM 1 FROM public.user_wallet WHERE user_id = _user FOR UPDATE;
  SELECT total_coins INTO _balance FROM public.user_wallet WHERE user_id = _user;
  IF _balance IS NULL OR _balance < _coins THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
  UPDATE public.user_wallet SET total_coins = total_coins - _coins, updated_at = now() WHERE user_id = _user;
  INSERT INTO public.coin_transactions (user_id, order_id, coins, type) VALUES (_user, _order_id, _coins, 'redeem');
  IF _order_id IS NOT NULL THEN PERFORM public.recalc_order_total(_order_id); END IF;
  RETURN _balance - _coins;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_order_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.pickup_otp IS DISTINCT FROM OLD.pickup_otp
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'These order details cannot be changed';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('placed','accepted','preparing','ready_for_pickup','picked_up','completed')
     AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.order_id = NEW.id AND p.status IN ('paid','captured')) THEN
    RAISE EXCEPTION 'Order has not been paid';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.auto_create_refund_on_cancel() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    if coalesce(lower(new.payment_method), 'cod') <> 'cod' then
      if exists (select 1 from public.payments where order_id = new.id and status in ('paid','captured')) then
        insert into public.refunds (order_id, customer_id, amount, reason, status)
        select new.id, new.customer_id, new.total_amount, 'Order cancelled - auto refund', 'pending'
        where new.customer_id is not null
          and not exists (select 1 from public.refunds r where r.order_id = new.id);
      end if;
    end if;
  end if;
  return new;
end; $$;