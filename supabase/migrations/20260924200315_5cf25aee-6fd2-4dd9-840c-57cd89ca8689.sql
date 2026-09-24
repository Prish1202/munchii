REVOKE ALL ON FUNCTION public.secure_order_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.secure_order_item_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.order_item_recalc() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_order_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_order_total(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_internal_function_secret() FROM PUBLIC, anon, authenticated;