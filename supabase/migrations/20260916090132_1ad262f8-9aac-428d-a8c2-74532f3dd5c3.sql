CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION private.is_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_member() TO authenticated;

DROP POLICY wishes_members ON public.wishes;
DROP POLICY wish_reactions_members ON public.wish_reactions;
DROP POLICY wish_comments_members ON public.wish_comments;
DROP POLICY foods_members ON public.foods;
DROP POLICY activities_members ON public.activities;
DROP POLICY memories_members ON public.memories;
DROP POLICY activity_log_members ON public.activity_log;
DROP POLICY daily_presence_members ON public.daily_presence;
DROP POLICY media_read ON storage.objects;
DROP POLICY media_insert ON storage.objects;
DROP POLICY media_update ON storage.objects;
DROP POLICY media_delete ON storage.objects;

CREATE POLICY wishes_members ON public.wishes FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY wish_reactions_members ON public.wish_reactions FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY wish_comments_members ON public.wish_comments FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY foods_members ON public.foods FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY activities_members ON public.activities FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY memories_members ON public.memories FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY activity_log_members ON public.activity_log FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());
CREATE POLICY daily_presence_members ON public.daily_presence FOR ALL TO authenticated USING (private.is_member()) WITH CHECK (private.is_member());

CREATE POLICY media_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND private.is_member());
CREATE POLICY media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND private.is_member());
CREATE POLICY media_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND private.is_member()) WITH CHECK (bucket_id = 'media' AND private.is_member());
CREATE POLICY media_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND private.is_member());

DROP FUNCTION IF EXISTS public.is_member();