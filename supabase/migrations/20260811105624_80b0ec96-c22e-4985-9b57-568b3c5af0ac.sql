-- 1. Message media lifecycle columns
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_lifecycle text NOT NULL DEFAULT 'PERSISTENT_FILE',
  ADD COLUMN IF NOT EXISTS media_file_path text,
  ADD COLUMN IF NOT EXISTS media_key text,
  ADD COLUMN IF NOT EXISTS media_iv text,
  ADD COLUMN IF NOT EXISTS media_viewed_at timestamptz;

-- 2. Cleanup queue
CREATE TABLE IF NOT EXISTS public.media_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  reason text NOT NULL DEFAULT 'view_once',
  processed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.media_cleanup_queue TO service_role;
ALTER TABLE public.media_cleanup_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view cleanup queue" ON public.media_cleanup_queue;
CREATE POLICY "Admins can view cleanup queue"
ON public.media_cleanup_queue FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.media_cleanup_queue TO authenticated;

CREATE INDEX IF NOT EXISTS idx_media_cleanup_pending
  ON public.media_cleanup_queue (created_at) WHERE processed_at IS NULL;

-- 3. Worker kick-off (pg_net → edge function)
CREATE OR REPLACE FUNCTION public.kick_media_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fvariumpdjqfajltqqrv.supabase.co/functions/v1/media-cleanup',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[MediaCleanup] kick failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.kick_media_cleanup() FROM PUBLIC, anon, authenticated;

-- 4. Enqueue media on message delete
CREATE OR REPLACE FUNCTION public.enqueue_message_media_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.media_file_path IS NOT NULL THEN
    INSERT INTO public.media_cleanup_queue (file_path, reason)
    VALUES (OLD.media_file_path, 'message_deleted');
    PERFORM public.kick_media_cleanup();
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_message_media_cleanup ON public.messages;
CREATE TRIGGER trg_enqueue_message_media_cleanup
AFTER DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_message_media_cleanup();

-- 5. Claim a view-once media item (server-verified, single use)
CREATE OR REPLACE FUNCTION public.claim_view_once_media(_message_id uuid)
RETURNS TABLE(file_path text, media_key text, media_iv text, media_type text, media_filename text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _msg public.messages%ROWTYPE;
  _conv public.conversations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _msg FROM public.messages WHERE id = _message_id FOR UPDATE;
  IF _msg.id IS NULL THEN
    RAISE EXCEPTION 'Media unavailable';
  END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = _msg.conversation_id;
  IF _conv.id IS NULL OR auth.uid() NOT IN (_conv.user1_id, _conv.user2_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _msg.sender_id = auth.uid() THEN
    RAISE EXCEPTION 'Sender cannot open a view once item';
  END IF;

  IF _msg.media_lifecycle <> 'VIEW_ONCE_MEDIA' OR _msg.media_file_path IS NULL THEN
    RAISE EXCEPTION 'Media unavailable';
  END IF;

  IF _msg.media_viewed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This media has already been opened';
  END IF;

  UPDATE public.messages
    SET media_viewed_at = now()
    WHERE id = _message_id;

  RETURN QUERY SELECT _msg.media_file_path, _msg.media_key, _msg.media_iv, _msg.media_type, _msg.media_filename;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_view_once_media(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_view_once_media(uuid) TO authenticated;

-- 6. Finalize: purge the encrypted object + metadata after viewing
CREATE OR REPLACE FUNCTION public.finalize_view_once_media(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _msg public.messages%ROWTYPE;
  _conv public.conversations%ROWTYPE;
BEGIN
  SELECT * INTO _msg FROM public.messages WHERE id = _message_id;
  IF _msg.id IS NULL OR _msg.media_lifecycle <> 'VIEW_ONCE_MEDIA' THEN
    RETURN;
  END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = _msg.conversation_id;
  IF _conv.id IS NULL OR auth.uid() NOT IN (_conv.user1_id, _conv.user2_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _msg.media_file_path IS NOT NULL THEN
    INSERT INTO public.media_cleanup_queue (file_path, reason)
    VALUES (_msg.media_file_path, 'view_once_opened');
  END IF;

  UPDATE public.messages
    SET media_url = NULL,
        media_file_path = NULL,
        media_key = NULL,
        media_iv = NULL,
        media_viewed_at = COALESCE(media_viewed_at, now())
    WHERE id = _message_id;

  PERFORM public.kick_media_cleanup();
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_view_once_media(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_view_once_media(uuid) TO authenticated;

-- 7. Safety net: sweep view-once media that was opened (or stale) and never finalized
CREATE OR REPLACE FUNCTION public.sweep_stale_view_once_media()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.media_cleanup_queue (file_path, reason)
  SELECT m.media_file_path, 'view_once_sweep'
  FROM public.messages m
  WHERE m.media_lifecycle = 'VIEW_ONCE_MEDIA'
    AND m.media_file_path IS NOT NULL
    AND (
      (m.media_viewed_at IS NOT NULL AND m.media_viewed_at < now() - interval '10 minutes')
      OR m.created_at < now() - interval '30 days'
    );

  UPDATE public.messages m
    SET media_url = NULL, media_file_path = NULL, media_key = NULL, media_iv = NULL
  WHERE m.media_lifecycle = 'VIEW_ONCE_MEDIA'
    AND m.media_file_path IS NOT NULL
    AND (
      (m.media_viewed_at IS NOT NULL AND m.media_viewed_at < now() - interval '10 minutes')
      OR m.created_at < now() - interval '30 days'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.sweep_stale_view_once_media() FROM PUBLIC, anon, authenticated;