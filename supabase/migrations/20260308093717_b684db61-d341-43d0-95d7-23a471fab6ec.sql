
CREATE OR REPLACE FUNCTION public.auto_complete_on_pickup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'picked_up' AND OLD.status = 'ready_for_pickup' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_complete_on_pickup
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_on_pickup();
