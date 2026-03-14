
-- Create payments table for Razorpay integration
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_order_id text NOT NULL,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id),
  UNIQUE(razorpay_order_id)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
CREATE POLICY "Customers can view own payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid()
  ));

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Restaurant owners can view payments for their orders
CREATE POLICY "Restaurants can view their payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.id = payments.order_id AND r.owner_id = auth.uid()
  ));

-- Add razorpay_transfer_id to payouts for tracking Route transfers
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS razorpay_transfer_id text;

-- Update the reward trigger to use ₹4 platform fee instead of ₹5
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
    _item_total := GREATEST(NEW.total_amount - 4, 0);
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

-- Update order status notification to use ₹4 fee
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _title text;
  _message text;
  _restaurant_name text;
  _owner_id uuid;
  _item_total numeric;
  _platform_fee numeric := 4;
  _commission numeric;
  _restaurant_credit numeric;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT name, owner_id INTO _restaurant_name, _owner_id FROM restaurants WHERE id = NEW.restaurant_id;

  IF NEW.customer_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'accepted' THEN
        _title := 'Order Accepted';
        _message := _restaurant_name || ' accepted your order!';
      WHEN 'preparing' THEN
        _title := 'Preparing Your Food';
        _message := _restaurant_name || ' is preparing your order.';
      WHEN 'ready_for_pickup' THEN
        _title := 'Ready for Pickup';
        _message := 'Your order at ' || _restaurant_name || ' is ready! Head over to pick it up.';
      WHEN 'completed' THEN
        _item_total := GREATEST(NEW.total_amount - _platform_fee, 0);
        _title := 'Order Complete';
        _message := 'Order complete! You earned ' || ROUND(_item_total * 0.03, 0)::text || ' points.';
      WHEN 'cancelled' THEN
        _title := 'Order Cancelled';
        _message := 'Your order at ' || _restaurant_name || ' was cancelled.';
      ELSE NULL;
    END CASE;

    IF _title IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (NEW.customer_id, _title, _message,
              CASE WHEN NEW.status = 'cancelled' THEN 'error' ELSE 'order' END,
              '/customer/orders/' || NEW.id);
    END IF;
  END IF;

  IF _owner_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'completed' THEN
        _item_total := GREATEST(NEW.total_amount - _platform_fee, 0);
        _commission := ROUND(_item_total * 0.10, 2);
        _restaurant_credit := _item_total - _commission;
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Completed', 'Order complete. ₹' || _restaurant_credit::text || ' credited (10% commission: ₹' || _commission::text || ').', 'earning', '/restaurant/orders');
      WHEN 'cancelled' THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Cancelled', 'An order was cancelled.', 'error', '/restaurant/orders');
      ELSE NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$function$;
