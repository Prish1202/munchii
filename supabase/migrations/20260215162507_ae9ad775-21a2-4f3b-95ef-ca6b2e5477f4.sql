
-- Table to track delivery partner online status and location
CREATE TABLE public.delivery_partner_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  current_lat NUMERIC,
  current_lng NUMERIC,
  city TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_partner_locations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own location"
  ON public.delivery_partner_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own location"
  ON public.delivery_partner_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'delivery'::app_role));

CREATE POLICY "Users can update own location"
  ON public.delivery_partner_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all locations"
  ON public.delivery_partner_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role needs to read all online riders for assignment
-- The edge function uses service_role key so RLS is bypassed

-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call edge function when order status changes
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payload JSONB;
BEGIN
  -- Only trigger on status changes to accepted/preparing/ready when no delivery partner assigned yet
  IF (OLD.status IS DISTINCT FROM NEW.status) 
     AND NEW.status IN ('accepted', 'preparing', 'ready')
     AND NEW.delivery_partner_id IS NULL
  THEN
    _payload := jsonb_build_object(
      'order_id', NEW.id,
      'restaurant_id', NEW.restaurant_id,
      'status', NEW.status
    );
    
    PERFORM extensions.http_post(
      url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/assign-rider',
      body := _payload::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on orders table
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();
