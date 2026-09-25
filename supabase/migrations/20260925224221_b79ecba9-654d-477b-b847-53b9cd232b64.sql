DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users, admins and serving restaurants can view profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.orders o JOIN public.restaurants r ON r.id = o.restaurant_id
             WHERE o.customer_id = profiles.id AND r.owner_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.get_public_profile(_id uuid)
RETURNS TABLE(id uuid, name text, username text, avatar_url text, campus text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.username, p.avatar_url, p.campus FROM public.profiles p WHERE p.id = _id
$$;

CREATE OR REPLACE FUNCTION public.search_profiles_by_username(_q text)
RETURNS TABLE(id uuid, name text, username text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.username, p.avatar_url FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND length(coalesce(_q,'')) >= 2 AND p.username IS NOT NULL
    AND p.username ILIKE '%' || replace(replace(replace(_q,'\','\\'),'%','\%'),'_','\_') || '%'
  ORDER BY p.username LIMIT 5
$$;

CREATE OR REPLACE FUNCTION public.is_username_available(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username) AND id <> auth.uid())
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_profiles_by_username(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_username_available(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated;