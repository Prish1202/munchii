CREATE OR REPLACE FUNCTION public.redeem_coins(_coins numeric, _order_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _balance numeric;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _coins IS NULL OR _coins <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  PERFORM 1 FROM public.user_wallet WHERE user_id = _user FOR UPDATE;
  SELECT total_coins INTO _balance FROM public.user_wallet WHERE user_id = _user;
  IF _balance IS NULL OR _balance < _coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  UPDATE public.user_wallet
    SET total_coins = total_coins - _coins,
        updated_at = now()
    WHERE user_id = _user;

  INSERT INTO public.coin_transactions (user_id, order_id, coins, type)
  VALUES (_user, _order_id, _coins, 'redeem');

  RETURN _balance - _coins;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_coins(numeric, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_coins(numeric, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_customer_phone_for_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_phone_for_owner(uuid) TO authenticated;