REVOKE EXECUTE ON FUNCTION public.enforce_pickup_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_item_available() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_slot_usage(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;