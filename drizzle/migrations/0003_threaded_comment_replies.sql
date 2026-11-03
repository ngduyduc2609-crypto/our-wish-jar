CREATE UNIQUE INDEX food_comments_id_unique ON public.food_comments(id);
CREATE UNIQUE INDEX activity_comments_id_unique ON public.activity_comments(id);
CREATE UNIQUE INDEX memory_comments_id_unique ON public.memory_comments(id);
ALTER TABLE public.wish_comments ADD COLUMN parent_id uuid REFERENCES public.wish_comments(id) ON DELETE SET NULL;
ALTER TABLE public.food_comments ADD COLUMN parent_id uuid REFERENCES public.food_comments(id) ON DELETE SET NULL;
ALTER TABLE public.activity_comments ADD COLUMN parent_id uuid REFERENCES public.activity_comments(id) ON DELETE SET NULL;
ALTER TABLE public.memory_comments ADD COLUMN parent_id uuid REFERENCES public.memory_comments(id) ON DELETE SET NULL;
CREATE INDEX wish_comments_parent_idx ON public.wish_comments(parent_id);
CREATE INDEX food_comments_parent_idx ON public.food_comments(parent_id);
CREATE INDEX activity_comments_parent_idx ON public.activity_comments(parent_id);
CREATE INDEX memory_comments_parent_idx ON public.memory_comments(parent_id);
CREATE FUNCTION public.validate_comment_parent() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE parent_target text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.parent_id IS DISTINCT FROM OLD.parent_id AND NEW.parent_id IS NOT NULL THEN RAISE EXCEPTION 'Reply parent cannot be changed'; END IF;
  IF NEW.parent_id IS NOT NULL THEN
    IF NEW.parent_id = NEW.id THEN RAISE EXCEPTION 'A comment cannot reply to itself'; END IF;
    EXECUTE format('SELECT %I::text FROM public.%I WHERE id = $1', TG_ARGV[0], TG_TABLE_NAME) INTO parent_target USING NEW.parent_id;
    IF parent_target IS NULL OR parent_target IS DISTINCT FROM (to_jsonb(NEW)->>TG_ARGV[0]) THEN RAISE EXCEPTION 'Reply must belong to the same post'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER wish_comment_parent BEFORE INSERT OR UPDATE ON public.wish_comments FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent('wish_id');
CREATE TRIGGER food_comment_parent BEFORE INSERT OR UPDATE ON public.food_comments FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent('food_id');
CREATE TRIGGER activity_comment_parent BEFORE INSERT OR UPDATE ON public.activity_comments FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent('activity_id');
CREATE TRIGGER memory_comment_parent BEFORE INSERT OR UPDATE ON public.memory_comments FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent('memory_id');