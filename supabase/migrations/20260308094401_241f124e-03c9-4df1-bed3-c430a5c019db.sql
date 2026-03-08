-- Notifications table for both customers and restaurant owners
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Trigger: notify customer on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _title text;
  _message text;
  _restaurant_name text;
  _owner_id uuid;
  _item_total numeric;
  _platform_fee numeric := 5;
  _restaurant_credit numeric;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT name, owner_id INTO _restaurant_name, _owner_id FROM restaurants WHERE id = NEW.restaurant_id;

  -- Customer notifications
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

  -- Restaurant notifications
  IF _owner_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'completed' THEN
        _restaurant_credit := NEW.total_amount - _platform_fee;
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Completed', 'Order complete. ₹' || _restaurant_credit::text || ' credited (₹' || _platform_fee::text || ' platform fee).', 'earning', '/restaurant/orders');
      WHEN 'cancelled' THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Cancelled', 'An order worth ₹' || NEW.total_amount::text || ' was cancelled.', 'error', '/restaurant/orders');
      ELSE NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_order_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();

-- Notify restaurant on new order insert
CREATE OR REPLACE FUNCTION public.notify_new_order()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid;
BEGIN
  SELECT owner_id INTO _owner_id FROM restaurants WHERE id = NEW.restaurant_id;
  IF _owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (_owner_id, 'New Order!', 'New order worth ₹' || NEW.total_amount::text || ' received.', 'order', '/restaurant/orders');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();

-- Notify on follow
CREATE OR REPLACE FUNCTION public.notify_new_follower()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _follower_name text;
BEGIN
  SELECT name INTO _follower_name FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (NEW.following_id, 'New Follower', COALESCE(_follower_name, 'Someone') || ' started following you!', 'social', '/customer/profile');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();