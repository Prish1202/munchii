CREATE TYPE public.merchant_type AS ENUM ('restaurant','canteen','grocery');
CREATE TYPE public.fulfillment_type AS ENUM ('READY_TO_PICK','PICK_AND_PACK','WEIGH_AND_PACK','PREPARE');
CREATE TYPE public.quantity_type AS ENUM ('FIXED','WEIGHT','UNIT','PRICE');
ALTER TABLE public.restaurants ADD COLUMN merchant_type public.merchant_type NOT NULL DEFAULT 'restaurant';
ALTER TABLE public.menu_items ADD COLUMN fulfillment_type public.fulfillment_type NOT NULL DEFAULT 'PREPARE',
  ADD COLUMN quantity_type public.quantity_type NOT NULL DEFAULT 'FIXED',
  ADD COLUMN quantity_options jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.order_items ADD COLUMN option_label text;
ALTER TABLE public.restaurant_compliance ADD COLUMN shop_license text, ADD COLUMN store_category text;

CREATE OR REPLACE FUNCTION public.secure_order_item_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _o public.orders%ROWTYPE; _m public.menu_items%ROWTYPE; _base numeric; _opt jsonb;
BEGIN
  SELECT * INTO _o FROM public.orders WHERE id = NEW.order_id;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF NEW.quantity IS NULL OR NEW.quantity < 1 OR NEW.quantity > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT * INTO _m FROM public.menu_items WHERE id = NEW.menu_item_id;
  IF _m.id IS NULL OR _m.restaurant_id IS DISTINCT FROM _o.restaurant_id THEN
    RAISE EXCEPTION 'Item does not belong to this restaurant';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) AND _o.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Order can no longer be changed';
  END IF;
  _base := _m.price;
  IF NEW.option_label IS NOT NULL THEN
    SELECT o INTO _opt FROM jsonb_array_elements(_m.quantity_options) o WHERE o->>'label' = NEW.option_label LIMIT 1;
    IF _opt IS NULL THEN RAISE EXCEPTION 'Invalid option'; END IF;
    _base := (_opt->>'price')::numeric;
  ELSIF _m.quantity_type <> 'FIXED' AND jsonb_array_length(_m.quantity_options) > 0 THEN
    RAISE EXCEPTION 'Please choose an option';
  END IF;
  NEW.price_at_time := round(_base * (1 - coalesce(_m.discount_percent, 0) / 100.0), 2);
  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.secure_order_item_insert() FROM PUBLIC, anon, authenticated;