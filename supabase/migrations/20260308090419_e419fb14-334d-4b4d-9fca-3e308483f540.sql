
CREATE OR REPLACE FUNCTION public.reward_coins_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _coins numeric;
  _item_total numeric;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.customer_id IS NOT NULL THEN
    -- Calculate 3% of item total (total_amount minus ₹5 platform fee)
    _item_total := GREATEST(NEW.total_amount - 5, 0);
    _coins := ROUND(_item_total * 0.03, 0);
    IF _coins > 0 THEN
      INSERT INTO public.user_wallet (user_id) VALUES (NEW.customer_id) ON CONFLICT DO NOTHING;
      UPDATE public.user_wallet SET total_coins = total_coins + _coins, updated_at = now() WHERE user_id = NEW.customer_id;
      INSERT INTO public.coin_transactions (user_id, order_id, coins, type) VALUES (NEW.customer_id, NEW.id, _coins, 'earn');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
