-- Restore the app to the shared private-couple mode used by the original Lovable export.
-- This keeps the data visible and writable without forcing Supabase Auth membership checks.

DROP POLICY IF EXISTS members_all ON public.members;
DROP POLICY IF EXISTS wishes_all ON public.wishes;
DROP POLICY IF EXISTS wish_reactions_all ON public.wish_reactions;
DROP POLICY IF EXISTS wish_comments_all ON public.wish_comments;
DROP POLICY IF EXISTS foods_all ON public.foods;
DROP POLICY IF EXISTS activities_all ON public.activities;
DROP POLICY IF EXISTS memories_all ON public.memories;
DROP POLICY IF EXISTS activity_log_all ON public.activity_log;
DROP POLICY IF EXISTS daily_presence_all ON public.daily_presence;
DROP POLICY IF EXISTS members_select ON public.members;
DROP POLICY IF EXISTS members_claim ON public.members;
DROP POLICY IF EXISTS wishes_members ON public.wishes;
DROP POLICY IF EXISTS wish_reactions_members ON public.wish_reactions;
DROP POLICY IF EXISTS wish_comments_members ON public.wish_comments;
DROP POLICY IF EXISTS foods_members ON public.foods;
DROP POLICY IF EXISTS activities_members ON public.activities;
DROP POLICY IF EXISTS memories_members ON public.memories;
DROP POLICY IF EXISTS activity_log_members ON public.activity_log;
DROP POLICY IF EXISTS daily_presence_members ON public.daily_presence;
DROP POLICY IF EXISTS media_read ON storage.objects;
DROP POLICY IF EXISTS media_insert ON storage.objects;
DROP POLICY IF EXISTS media_update ON storage.objects;
DROP POLICY IF EXISTS media_delete ON storage.objects;

ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_presence DISABLE ROW LEVEL SECURITY;

CREATE POLICY members_all ON public.members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY wishes_all ON public.wishes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY wish_reactions_all ON public.wish_reactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY wish_comments_all ON public.wish_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY foods_all ON public.foods FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY activities_all ON public.activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY memories_all ON public.memories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY activity_log_all ON public.activity_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY daily_presence_all ON public.daily_presence FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY media_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY media_insert ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY media_update ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');
CREATE POLICY media_delete ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'media');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_reactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_presence TO anon, authenticated;
