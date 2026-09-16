CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  emoji text NOT NULL DEFAULT '💗',
  color text NOT NULL DEFAULT 'pink',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO anon, authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all" ON public.members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  note text,
  category text NOT NULL DEFAULT 'other',
  difficulty text NOT NULL DEFAULT 'medium',
  deadline date,
  proposed_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishes TO anon, authenticated;
GRANT ALL ON public.wishes TO service_role;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishes_all" ON public.wishes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.wish_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wish_id, member_id, emoji)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_reactions TO anon, authenticated;
GRANT ALL ON public.wish_reactions TO service_role;
ALTER TABLE public.wish_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wish_reactions_all" ON public.wish_reactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.wish_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_comments TO anon, authenticated;
GRANT ALL ON public.wish_comments TO service_role;
ALTER TABLE public.wish_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wish_comments_all" ON public.wish_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  place text,
  address text,
  price_level int NOT NULL DEFAULT 2,
  rating int,
  image_url text,
  note text,
  tried boolean NOT NULL DEFAULT false,
  tried_at timestamptz,
  added_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO anon, authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_all" ON public.foods FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  tags text[] NOT NULL DEFAULT '{}',
  place text,
  note text,
  image_url text,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  added_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_all" ON public.activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  note text,
  image_url text,
  happened_on date NOT NULL DEFAULT CURRENT_DATE,
  rating int,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  created_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO anon, authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memories_all" ON public.memories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  action text NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO anon, authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log_all" ON public.activity_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.daily_presence (
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_presence TO anon, authenticated;
GRANT ALL ON public.daily_presence TO service_role;
ALTER TABLE public.daily_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_presence_all" ON public.daily_presence FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.members (name, emoji, color) VALUES
  ('Thu Thủy', '🌸', 'pink'),
  ('Duy Đức', '🌿', 'green');

CREATE INDEX idx_wish_reactions_wish ON public.wish_reactions(wish_id);
CREATE INDEX idx_wish_comments_wish ON public.wish_comments(wish_id);
CREATE INDEX idx_memories_date ON public.memories(happened_on DESC);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);