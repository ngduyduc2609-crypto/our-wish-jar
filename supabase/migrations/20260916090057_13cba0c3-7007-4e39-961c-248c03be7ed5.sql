ALTER TABLE public.members ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid());
$$;

REVOKE ALL ON public.members, public.wishes, public.wish_reactions, public.wish_comments, public.foods, public.activities, public.memories, public.activity_log, public.daily_presence FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishes, public.wish_reactions, public.wish_comments, public.foods, public.activities, public.memories, public.activity_log, public.daily_presence TO authenticated;
GRANT SELECT, UPDATE ON public.members TO authenticated;

DROP POLICY IF EXISTS members_all ON public.members;
DROP POLICY IF EXISTS wishes_all ON public.wishes;
DROP POLICY IF EXISTS wish_reactions_all ON public.wish_reactions;
DROP POLICY IF EXISTS wish_comments_all ON public.wish_comments;
DROP POLICY IF EXISTS foods_all ON public.foods;
DROP POLICY IF EXISTS activities_all ON public.activities;
DROP POLICY IF EXISTS memories_all ON public.memories;
DROP POLICY IF EXISTS activity_log_all ON public.activity_log;
DROP POLICY IF EXISTS daily_presence_all ON public.daily_presence;

CREATE POLICY members_select ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY members_claim ON public.members FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY wishes_members ON public.wishes FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY wish_reactions_members ON public.wish_reactions FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY wish_comments_members ON public.wish_comments FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY foods_members ON public.foods FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY activities_members ON public.activities FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY memories_members ON public.memories FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY activity_log_members ON public.activity_log FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY daily_presence_members ON public.daily_presence FOR ALL TO authenticated USING (public.is_member()) WITH CHECK (public.is_member());

DROP POLICY IF EXISTS media_read ON storage.objects;
DROP POLICY IF EXISTS media_insert ON storage.objects;
DROP POLICY IF EXISTS media_update ON storage.objects;
DROP POLICY IF EXISTS media_delete ON storage.objects;

CREATE POLICY media_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND public.is_member());
CREATE POLICY media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_member());
CREATE POLICY media_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_member()) WITH CHECK (bucket_id = 'media' AND public.is_member());
CREATE POLICY media_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_member());