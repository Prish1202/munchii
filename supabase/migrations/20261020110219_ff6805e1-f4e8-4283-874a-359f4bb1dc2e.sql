CREATE OR REPLACE FUNCTION public.notify_staff_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'placed' AND OLD.status = 'pending_payment' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT s.user_id, 'New Order!', 'New paid order worth ₹' || NEW.total_amount::text || ' received. Tap to accept.', 'order', '/staff'
    FROM public.restaurant_staff s
    WHERE s.restaurant_id = NEW.restaurant_id AND s.is_active;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_staff_new_order() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_staff_new_order AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_order();