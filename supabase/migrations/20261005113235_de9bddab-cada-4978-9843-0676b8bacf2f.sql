ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS weekly_hours jsonb;
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _title text; _message text; _restaurant_name text; _owner_id uuid;
  _item_total numeric; _platform_fee numeric := 3; _commission numeric; _restaurant_credit numeric;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT name, owner_id INTO _restaurant_name, _owner_id FROM restaurants WHERE id = NEW.restaurant_id;
  IF NEW.customer_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'accepted' THEN _title := 'Order Accepted'; _message := _restaurant_name || ' accepted your order!';
      WHEN 'preparing' THEN _title := 'Preparing Your Food'; _message := _restaurant_name || ' is preparing your order.';
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
      WHEN 'completed' THEN
        _item_total := GREATEST(NEW.total_amount - _platform_fee, 0);
        _commission := ROUND(_item_total * 0.05, 2);
        _restaurant_credit := _item_total - _commission;
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Completed', 'Order complete. ₹' || _restaurant_credit::text || ' credited (5% commission: ₹' || _commission::text || ').', 'earning', '/restaurant/orders');
      WHEN 'cancelled' THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (_owner_id, 'Order Cancelled', 'An order was cancelled.', 'error', '/restaurant/orders');
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$function$;