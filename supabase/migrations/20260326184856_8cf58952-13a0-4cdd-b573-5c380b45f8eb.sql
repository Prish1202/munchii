-- Add city and state columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;

-- Update handle_new_user to also save phone, city, state
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, name, phone, city, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'state'
  );
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;