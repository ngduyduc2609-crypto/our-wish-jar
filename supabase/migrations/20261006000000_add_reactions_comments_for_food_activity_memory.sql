CREATE TABLE public.food_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (food_id, member_id, emoji)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_reactions TO anon, authenticated;
GRANT ALL ON public.food_reactions TO service_role;
ALTER TABLE public.food_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_reactions_all" ON public.food_reactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.food_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_comments TO anon, authenticated;
GRANT ALL ON public.food_comments TO service_role;
ALTER TABLE public.food_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_comments_all" ON public.food_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.activity_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, member_id, emoji)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_reactions TO anon, authenticated;
GRANT ALL ON public.activity_reactions TO service_role;
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_reactions_all" ON public.activity_reactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_comments TO anon, authenticated;
GRANT ALL ON public.activity_comments TO service_role;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_comments_all" ON public.activity_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.memory_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (memory_id, member_id, emoji)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_reactions TO anon, authenticated;
GRANT ALL ON public.memory_reactions TO service_role;
ALTER TABLE public.memory_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memory_reactions_all" ON public.memory_reactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.memory_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_comments TO anon, authenticated;
GRANT ALL ON public.memory_comments TO service_role;
ALTER TABLE public.memory_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memory_comments_all" ON public.memory_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_food_reactions_food ON public.food_reactions(food_id);
CREATE INDEX idx_food_comments_food ON public.food_comments(food_id);
CREATE INDEX idx_activity_reactions_activity ON public.activity_reactions(activity_id);
CREATE INDEX idx_activity_comments_activity ON public.activity_comments(activity_id);
CREATE INDEX idx_memory_reactions_memory ON public.memory_reactions(memory_id);
CREATE INDEX idx_memory_comments_memory ON public.memory_comments(memory_id);
