
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to call edge function on notification insert
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text;
  _service_role_key text;
  _payload jsonb;
  _url text;
BEGIN
  -- Build payload
  _payload := jsonb_build_object(
    'user_id', NEW.user_id,
    'title', NEW.title,
    'message', NEW.message,
    'url', CASE WHEN NEW.link IS NOT NULL THEN NEW.link ELSE NULL END
  );

  -- Get Supabase URL and service role key from vault or config
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);

  -- If settings not available, try environment-style approach
  IF _supabase_url IS NULL OR _supabase_url = '' THEN
    _supabase_url := 'https://fvariumpdjqfajltqqrv.supabase.co';
  END IF;

  _url := _supabase_url || '/functions/v1/send-onesignal-push';

  -- Make async HTTP POST to edge function
  PERFORM extensions.http_post(
    url := _url,
    body := _payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    )
  );

  RAISE LOG '[PushTrigger] Fired for user_id=%, title=%', NEW.user_id, NEW.title;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block notification insert if push fails
  RAISE LOG '[PushTrigger] Error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trigger_push_on_notification_insert ON public.notifications;
CREATE TRIGGER trigger_push_on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();
