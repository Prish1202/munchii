
-- 1. Fix menu-images storage policies
DROP POLICY IF EXISTS "Restaurant owners can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can insert into own menu folder" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update own menu folder" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete own menu folder" ON storage.objects;

CREATE POLICY "Restaurant owners can insert into own menu folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.owner_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
  )
);

CREATE POLICY "Restaurant owners can update own menu folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.owner_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
  )
);

CREATE POLICY "Restaurant owners can delete own menu folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.owner_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
  )
);

-- 2. Prevent users from self-assigning 'restaurant' role; only customer allowed via client.
-- The handle_new_user trigger (SECURITY DEFINER) still assigns restaurant role from signup metadata.
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert own customer role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'customer'::app_role);

-- 3. Revoke EXECUTE from anon/public on SECURITY DEFINER functions that should be authenticated-only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_blocked_by(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard_top10() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_restaurant_avg_rating(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_coins(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked_by(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_top10() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_avg_rating(uuid) TO authenticated;
