CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_data jsonb := '{}'::jsonb;
  v_order_id text;
BEGIN
  -- Routing tags for the app: { type: 'order', id: '...' } opens order tracking,
  -- { type: 'offer' } opens the offers tab.
  IF NEW.type IS NOT NULL THEN
    v_data := v_data || jsonb_build_object('type', NEW.type);
  END IF;
  IF NEW.link ~ '^/customer/orders/[0-9a-fA-F-]{36}$' THEN
    v_order_id := substring(NEW.link from '([0-9a-fA-F-]{36})$');
    v_data := v_data || jsonb_build_object('type', 'order', 'id', v_order_id);
  END IF;

  PERFORM net.http_post(
    url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/send-firebase-push',
    body := jsonb_build_object('user_id', NEW.user_id, 'title', NEW.title, 'message', NEW.message, 'url', NEW.link, 'data', v_data),
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-internal-secret', public.get_internal_function_secret())
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[PushTrigger] Error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.trigger_push_notification() FROM PUBLIC, anon, authenticated;