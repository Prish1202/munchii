
-- Drop the auto-assign trigger and function
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP FUNCTION IF EXISTS public.notify_order_status_change();

-- Drop deliveries table CASCADE
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.delivery_partner_locations CASCADE;
DROP TYPE IF EXISTS public.delivery_status CASCADE;

-- Drop policies referencing delivery_partner_id
DROP POLICY IF EXISTS "Delivery partners can update assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Delivery partners can view their payouts" ON public.payouts;

ALTER TABLE public.orders DROP COLUMN IF EXISTS delivery_partner_id;

CREATE POLICY "Users can view order items for their orders"
ON public.order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));

ALTER TABLE public.payouts DROP COLUMN IF EXISTS delivery_amount;

-- Update order_status enum
ALTER TABLE public.orders ALTER COLUMN status DROP DEFAULT;
CREATE TYPE public.order_status_new AS ENUM ('placed','accepted','preparing','ready_for_pickup','picked_up','completed','cancelled');
ALTER TABLE public.orders ALTER COLUMN status TYPE public.order_status_new USING (
  CASE status::text WHEN 'ready' THEN 'ready_for_pickup'::public.order_status_new WHEN 'delivered' THEN 'completed'::public.order_status_new ELSE status::text::public.order_status_new END
);
DROP TYPE public.order_status;
ALTER TYPE public.order_status_new RENAME TO order_status;
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'placed'::public.order_status;

-- Drop ALL policies referencing app_role
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins can manage all menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all interests" ON public.city_interests;
DROP POLICY IF EXISTS "Owners can insert restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert order items" ON public.order_items;

-- Drop functions CASCADE (removes auth trigger too)
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Alter enum
DELETE FROM public.user_roles WHERE role = 'delivery';
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
CREATE TYPE public.app_role_new AS ENUM ('customer', 'restaurant', 'admin');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role_new USING (role::text::public.app_role_new);
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email));
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- Recreate the auth trigger that was dropped
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $function$;

-- Recreate all policies
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role IN ('customer'::app_role, 'restaurant'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id AND has_role(auth.uid(), 'customer'::app_role));
CREATE POLICY "Admins can manage all restaurants" ON public.restaurants FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners can insert restaurant" ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id AND has_role(auth.uid(), 'restaurant'::app_role));
CREATE POLICY "Admins can manage all menu items" ON public.menu_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers can insert order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
CREATE POLICY "Admins can manage all payouts" ON public.payouts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all interests" ON public.city_interests FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
