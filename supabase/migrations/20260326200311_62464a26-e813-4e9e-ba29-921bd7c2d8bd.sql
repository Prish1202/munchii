-- Update handle_new_user to also save area from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, name, phone, city, state, campus)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'state',
    NEW.raw_user_meta_data ->> 'area'
  );
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- Create refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  customer_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  razorpay_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all refunds" ON public.refunds FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers can view own refunds" ON public.refunds FOR SELECT TO authenticated USING (auth.uid() = customer_id);