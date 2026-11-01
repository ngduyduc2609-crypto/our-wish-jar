-- Reactions & comments for foods, activities, memories — mirrors the existing wish_reactions / wish_comments shape
create table public.food_reactions (
  id uuid not null default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now()
);
create table public.food_comments (
  id uuid not null default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create table public.activity_reactions (
  id uuid not null default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now()
);
create table public.activity_comments (
  id uuid not null default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create table public.memory_reactions (
  id uuid not null default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now()
);
create table public.memory_comments (
  id uuid not null default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.food_reactions, public.food_comments, public.activity_reactions, public.activity_comments, public.memory_reactions, public.memory_comments to authenticated;
grant all on public.food_reactions, public.food_comments, public.activity_reactions, public.activity_comments, public.memory_reactions, public.memory_comments to service_role;

alter table public.food_reactions enable row level security;
alter table public.food_comments enable row level security;
alter table public.activity_reactions enable row level security;
alter table public.activity_comments enable row level security;
alter table public.memory_reactions enable row level security;
alter table public.memory_comments enable row level security;

create policy food_reactions_members on public.food_reactions for all to authenticated using (private.is_member()) with check (private.is_member());
create policy food_comments_members on public.food_comments for all to authenticated using (private.is_member()) with check (private.is_member());
create policy activity_reactions_members on public.activity_reactions for all to authenticated using (private.is_member()) with check (private.is_member());
create policy activity_comments_members on public.activity_comments for all to authenticated using (private.is_member()) with check (private.is_member());
create policy memory_reactions_members on public.memory_reactions for all to authenticated using (private.is_member()) with check (private.is_member());
create policy memory_comments_members on public.memory_comments for all to authenticated using (private.is_member()) with check (private.is_member());

-- Notification triggers, mirroring tg_notify_reaction / tg_notify_comment on wish tables
create function public.tg_notify_food_reaction() returns trigger language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  select f.name into t from public.foods f where f.id = new.food_id;
  perform public.notify_members(new.member_id, 'reaction', coalesce(t, '') || '|' || new.emoji);
  return new;
end
$fn$;
create function public.tg_notify_food_comment() returns trigger language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  select f.name into t from public.foods f where f.id = new.food_id;
  perform public.notify_members(new.member_id, 'comment', coalesce(t, ''));
  return new;
end
$fn$;
create function public.tg_notify_activity_reaction() returns trigger language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  select a.name into t from public.activities a where a.id = new.activity_id;
  perform public.notify_members(new.member_id, 'reaction', coalesce(t, '') || '|' || new.emoji);
  return new;
end
$fn$;
create function public.tg_notify_activity_comment() returns trigger language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  select a.name into t from public.activities a where a.id = new.activity_id;
  perform public.notify_members(new.member_id, 'comment', coalesce(t, ''));
  return new;
end
$fn$;
create function public.tg_notify_memory_reaction() returns trigger language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  select m.title into t from public.memories m where m.id = new.memory_id;
  perform public.notify_members(new.member_id, 'reaction', coalesce(t, '') || '|' || new.emoji);
  return new;
end
$fn$;
create function public.tg_notify_memory_comment() returns trigger language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  select m.title into t from public.memories m where m.id = new.memory_id;
  perform public.notify_members(new.member_id, 'comment', coalesce(t, ''));
  return new;
end
$fn$;

create trigger notify_food_reaction after insert on public.food_reactions for each row execute function public.tg_notify_food_reaction();
create trigger notify_food_comment after insert on public.food_comments for each row execute function public.tg_notify_food_comment();
create trigger notify_activity_reaction after insert on public.activity_reactions for each row execute function public.tg_notify_activity_reaction();
create trigger notify_activity_comment after insert on public.activity_comments for each row execute function public.tg_notify_activity_comment();
create trigger notify_memory_reaction after insert on public.memory_reactions for each row execute function public.tg_notify_memory_reaction();
create trigger notify_memory_comment after insert on public.memory_comments for each row execute function public.tg_notify_memory_comment();