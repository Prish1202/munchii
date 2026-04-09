-- Ensure pg_net extension is enabled for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop trigger if it exists (in case partial state)
DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;

-- Recreate the trigger
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();