DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can view visible profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP TRIGGER IF EXISTS trg_enqueue_message_media_cleanup ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.followers;
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON public.followers;
DROP TABLE IF EXISTS public.message_reactions, public.messages, public.conversations,
  public.user_public_keys, public.user_private_key_backups,
  public.club_messages, public.club_members, public.clubs,
  public.pulse_likes, public.pulse_views, public.pulses,
  public.followers, public.blocked_users, public.abuse_reports,
  public.media_cleanup_queue CASCADE;
DROP FUNCTION IF EXISTS public.claim_view_once_media(uuid);
DROP FUNCTION IF EXISTS public.finalize_view_once_media(uuid);
DROP FUNCTION IF EXISTS public.sweep_stale_view_once_media();
DROP FUNCTION IF EXISTS public.enqueue_message_media_cleanup();
DROP FUNCTION IF EXISTS public.kick_media_cleanup();
DROP FUNCTION IF EXISTS public.notify_new_message();
DROP FUNCTION IF EXISTS public.notify_new_follower();
DROP FUNCTION IF EXISTS public.is_blocked_between(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_blocked_by(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_club_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_club_member(uuid, uuid);
DROP TYPE IF EXISTS public.club_role;
DROP TYPE IF EXISTS public.pulse_media_type;