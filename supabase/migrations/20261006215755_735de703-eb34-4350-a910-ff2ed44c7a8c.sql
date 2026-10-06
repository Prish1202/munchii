CREATE OR REPLACE FUNCTION public.claim_push_token(_token text, _device_type text DEFAULT 'android')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR coalesce(length(_token),0) < 10 THEN RETURN; END IF;
  INSERT INTO public.push_subscriptions (user_id, player_id, device_type)
  VALUES (auth.uid(), _token, coalesce(_device_type,'android'))
  ON CONFLICT (player_id) DO UPDATE
    SET user_id = EXCLUDED.user_id, device_type = EXCLUDED.device_type, updated_at = now();
END; $$;
REVOKE ALL ON FUNCTION public.claim_push_token(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_push_token(text, text) TO authenticated;