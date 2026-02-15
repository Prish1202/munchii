
-- Drop the old trigger and function that used incorrect pg_net syntax
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP FUNCTION IF EXISTS public.notify_order_status_change();

-- Recreate using net.http_post (pg_net extension correct schema)
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when status changes to accepted/preparing/ready and no delivery partner assigned
  IF (OLD.status IS DISTINCT FROM NEW.status) 
     AND NEW.status IN ('accepted', 'preparing', 'ready')
     AND NEW.delivery_partner_id IS NULL
  THEN
    PERFORM net.http_post(
      url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/assign-rider'::text,
      body := jsonb_build_object(
        'order_id', NEW.id,
        'restaurant_id', NEW.restaurant_id
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YXJpdW1wZGpxZmFqbHRxcXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODAzODYsImV4cCI6MjA4MjI1NjM4Nn0.XjmUdcLVwToapulAmREZZKzWDyCJQhbQIlVe6nZnbEM'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();
