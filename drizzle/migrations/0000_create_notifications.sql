CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  actor_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  kind text NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX notifications_recipient_idx ON public.notifications (recipient_member_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_members ON public.notifications
  FOR ALL TO authenticated
  USING (private.is_member())
  WITH CHECK (private.is_member());

CREATE OR REPLACE FUNCTION public.notify_members(_actor uuid, _kind text, _subject text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.notifications (recipient_member_id, actor_member_id, kind, subject)
  SELECT m.id, _actor, _kind, _subject
  FROM public.members m
  WHERE _actor IS NOT NULL AND m.id <> _actor AND m.user_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.tg_notify_wish() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_members(NEW.proposed_by, 'wish', NEW.title);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_notify_food() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_members(NEW.added_by, 'food', NEW.name);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_notify_activity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_members(NEW.added_by, 'activity', NEW.name);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_notify_memory() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_members(NEW.created_by, 'memory', NEW.title);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_notify_reaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT w.title INTO t FROM public.wishes w WHERE w.id = NEW.wish_id;
  PERFORM public.notify_members(NEW.member_id, 'reaction', COALESCE(t, '') || '|' || NEW.emoji);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_notify_comment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT w.title INTO t FROM public.wishes w WHERE w.id = NEW.wish_id;
  PERFORM public.notify_members(NEW.member_id, 'comment', t);
  RETURN NEW;
END $$;

CREATE TRIGGER notify_wish AFTER INSERT ON public.wishes FOR EACH ROW EXECUTE FUNCTION public.tg_notify_wish();
CREATE TRIGGER notify_food AFTER INSERT ON public.foods FOR EACH ROW EXECUTE FUNCTION public.tg_notify_food();
CREATE TRIGGER notify_activity AFTER INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.tg_notify_activity();
CREATE TRIGGER notify_memory AFTER INSERT ON public.memories FOR EACH ROW EXECUTE FUNCTION public.tg_notify_memory();
CREATE TRIGGER notify_reaction AFTER INSERT ON public.wish_reactions FOR EACH ROW EXECUTE FUNCTION public.tg_notify_reaction();
CREATE TRIGGER notify_comment AFTER INSERT ON public.wish_comments FOR EACH ROW EXECUTE FUNCTION public.tg_notify_comment();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;