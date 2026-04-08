
-- Drop the broken trigger function and recreate with correct pg_net usage
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use pg_net to make async HTTP POST to edge function
  PERFORM net.http_post(
    url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/send-onesignal-push',
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'url', NEW.link
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YXJpdW1wZGpxZmFqbHRxcXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODAzODYsImV4cCI6MjA4MjI1NjM4Nn0.XjmUdcLVwToapulAmREZZKzWDyCJQhbQIlVe6nZnbEM'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[PushTrigger] Error: %', SQLERRM;
  RETURN NEW;
END;
$$;
