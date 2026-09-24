
-- ===== Internal secret for DB -> edge function calls =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'internal_function_secret') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'internal_function_secret');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_internal_function_secret()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, vault AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_internal_function_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_function_secret() TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/send-onesignal-push',
    body := jsonb_build_object('user_id', NEW.user_id, 'title', NEW.title, 'message', NEW.message, 'url', NEW.link),
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-internal-secret', public.get_internal_function_secret())
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[PushTrigger] Error: %', SQLERRM;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.kick_media_cleanup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/media-cleanup',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-internal-secret', public.get_internal_function_secret())
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[MediaCleanup] kick failed: %', SQLERRM;
END; $$;

-- ===== Server-side order totals, secure OTP, payment-gated fulfilment =====
CREATE OR REPLACE FUNCTION public.recalc_order_total(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _items numeric; _coins numeric;
BEGIN
  SELECT coalesce(sum(price_at_time * quantity), 0) INTO _items FROM public.order_items WHERE order_id = _order_id;
  SELECT coalesce(sum(coins), 0) INTO _coins FROM public.coin_transactions WHERE order_id = _order_id AND type = 'redeem';
  UPDATE public.orders SET total_amount = GREATEST(_items + 4 - _coins, 0) WHERE id = _order_id;
END; $$;
REVOKE ALL ON FUNCTION public.recalc_order_total(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.secure_order_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.total_amount := 4;               -- recalculated from items server-side
    NEW.payment_method := 'razorpay';    -- online payment only
    NEW.status := 'pending_payment';
  END IF;
  NEW.pickup_otp := lpad((((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 9000) + 1000)::text, 4, '0');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_secure_order_insert ON public.orders;
CREATE TRIGGER trg_secure_order_insert BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.secure_order_insert();

CREATE OR REPLACE FUNCTION public.secure_order_item_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.orders%ROWTYPE; _m public.menu_items%ROWTYPE;
BEGIN
  SELECT * INTO _o FROM public.orders WHERE id = NEW.order_id;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF NEW.quantity IS NULL OR NEW.quantity < 1 OR NEW.quantity > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT * INTO _m FROM public.menu_items WHERE id = NEW.menu_item_id;
  IF _m.id IS NULL OR _m.restaurant_id IS DISTINCT FROM _o.restaurant_id THEN
    RAISE EXCEPTION 'Item does not belong to this restaurant';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) AND _o.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Order can no longer be changed';
  END IF;
  NEW.price_at_time := round(_m.price * (1 - coalesce(_m.discount_percent, 0) / 100.0), 2);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_secure_order_item_insert ON public.order_items;
CREATE TRIGGER trg_secure_order_item_insert BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.secure_order_item_insert();

CREATE OR REPLACE FUNCTION public.order_item_recalc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_order_total(NEW.order_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_order_item_recalc ON public.order_items;
CREATE TRIGGER trg_order_item_recalc AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_item_recalc();

CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- service role / internal triggers / admins are trusted
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
     AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.order_id = NEW.id AND p.status = 'captured') THEN
    RAISE EXCEPTION 'Order has not been paid';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_order_update ON public.orders;
CREATE TRIGGER trg_guard_order_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

CREATE OR REPLACE FUNCTION public.redeem_coins(_coins numeric, _order_id uuid DEFAULT NULL::uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    IF _already + _coins > floor((_items + 4) * 0.5) THEN RAISE EXCEPTION 'Too many coins for this order'; END IF;
  END IF;

  PERFORM 1 FROM public.user_wallet WHERE user_id = _user FOR UPDATE;
  SELECT total_coins INTO _balance FROM public.user_wallet WHERE user_id = _user;
  IF _balance IS NULL OR _balance < _coins THEN RAISE EXCEPTION 'Insufficient coins'; END IF;

  UPDATE public.user_wallet SET total_coins = total_coins - _coins, updated_at = now() WHERE user_id = _user;
  INSERT INTO public.coin_transactions (user_id, order_id, coins, type) VALUES (_user, _order_id, _coins, 'redeem');

  IF _order_id IS NOT NULL THEN PERFORM public.recalc_order_total(_order_id); END IF;
  RETURN _balance - _coins;
END; $$;

-- ===== Tighten social table reads =====
DROP POLICY IF EXISTS "Anyone authenticated can view public keys" ON public.user_public_keys;
CREATE POLICY "Users can view keys of own conversation partners" ON public.user_public_keys
FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.user1_id = auth.uid() AND c.user2_id = user_public_keys.user_id)
       OR (c.user2_id = auth.uid() AND c.user1_id = user_public_keys.user_id))
);

DROP POLICY IF EXISTS "Anyone authenticated can view follows" ON public.followers;
CREATE POLICY "Users can view own follow relationships" ON public.followers
FOR SELECT TO authenticated USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Authenticated can view clubs" ON public.clubs;
CREATE POLICY "Users can view public or joined clubs" ON public.clubs
FOR SELECT TO authenticated USING (
  is_private = false OR created_by = auth.uid() OR public.is_club_member(id, auth.uid())
);

DROP POLICY IF EXISTS "Authenticated can view club members" ON public.club_members;
CREATE POLICY "Members can view members of their clubs" ON public.club_members
FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_club_member(club_id, auth.uid())
);

-- ===== Public buckets: stop file listing (public URLs keep working) =====
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
