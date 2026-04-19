-- Toi & Moi — conversations unifiées (messages, thread_topics, audit souvenirs)
-- À exécuter dans Supabase SQL Editor.

alter table public.memories
  add column if not exists updated_at timestamptz not null default now();

-- =========================================================================
-- Table messages (surface polymorphe : memory | thread | main)
-- =========================================================================
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  couple_id     uuid not null references public.couples(id) on delete cascade,
  context_type  text not null check (context_type in ('memory','thread','main')),
  context_id    uuid,
  author_id     uuid references auth.users(id),
  kind          text not null check (kind in ('text','system')),
  body          text,
  metadata      jsonb not null default '{}'::jsonb,
  reply_to      uuid references public.messages(id) on delete set null,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz,
  constraint messages_context_id_required check (
    (context_type = 'main' and context_id is null) or
    (context_type <> 'main' and context_id is not null)
  ),
  constraint messages_system_needs_event check (
    kind <> 'system' or metadata ? 'event'
  ),
  constraint messages_text_needs_author check (
    kind <> 'text' or author_id is not null
  )
);

create index if not exists messages_context_idx
  on public.messages (couple_id, context_type, context_id, created_at desc);

-- =========================================================================
-- Table message_reads (accusés de lecture)
-- =========================================================================
create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  read_at    timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- =========================================================================
-- Table thread_topics (questions poussées dans le fil principal)
-- =========================================================================
create table if not exists public.thread_topics (
  id                 uuid primary key default uuid_generate_v4(),
  couple_id          uuid not null references public.couples(id) on delete cascade,
  question_index     integer,
  custom_question_id uuid references public.custom_questions(id) on delete cascade,
  pushed_by          uuid not null references auth.users(id),
  pushed_at          timestamptz not null default now(),
  discussed_at       timestamptz,
  discussed_by       uuid references auth.users(id),
  constraint thread_topics_one_source check (
    (question_index is not null and custom_question_id is null) or
    (question_index is null and custom_question_id is not null)
  )
);

create unique index if not exists thread_topics_builtin_unique
  on public.thread_topics (couple_id, question_index)
  where question_index is not null;

create unique index if not exists thread_topics_custom_unique
  on public.thread_topics (couple_id, custom_question_id)
  where custom_question_id is not null;

-- =========================================================================
-- Trigger : nettoyer les messages liés à un souvenir supprimé
-- =========================================================================
create or replace function public.cleanup_memory_messages()
returns trigger as $$
begin
  delete from public.messages
    where context_type = 'memory' and context_id = old.id;
  return old;
end;
$$ language plpgsql;

drop trigger if exists memories_cleanup_messages on public.memories;
create trigger memories_cleanup_messages
  before delete on public.memories
  for each row execute function public.cleanup_memory_messages();

-- =========================================================================
-- Trigger : nettoyer les messages d'un thread quand le topic est supprimé
-- =========================================================================
create or replace function public.cleanup_topic_messages()
returns trigger as $$
begin
  delete from public.messages
    where context_type = 'thread' and context_id = old.id;
  return old;
end;
$$ language plpgsql;

drop trigger if exists thread_topics_cleanup_messages on public.thread_topics;
create trigger thread_topics_cleanup_messages
  before delete on public.thread_topics
  for each row execute function public.cleanup_topic_messages();

-- =========================================================================
-- Fonction : création d'un message système (security definer)
-- =========================================================================
create or replace function public.create_system_message(
  p_couple_id    uuid,
  p_context_type text,
  p_context_id   uuid,
  p_event        text,
  p_metadata     jsonb default '{}'::jsonb,
  p_author_id    uuid default null
)
returns uuid as $$
declare
  new_id uuid;
  merged_metadata jsonb;
begin
  if p_context_type not in ('memory','thread','main') then
    raise exception 'invalid context_type %', p_context_type;
  end if;

  merged_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('event', p_event);

  insert into public.messages (
    couple_id, context_type, context_id, author_id, kind, body, metadata
  ) values (
    p_couple_id,
    p_context_type,
    case when p_context_type = 'main' then null else p_context_id end,
    p_author_id,
    'system',
    null,
    merged_metadata
  )
  returning id into new_id;

  return new_id;
end;
$$ language plpgsql security definer set search_path = public;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.thread_topics enable row level security;

drop policy if exists "Members can view messages" on public.messages;
create policy "Members can view messages" on public.messages
  for select using (couple_id = public.get_my_couple_id());

drop policy if exists "Members can insert text messages" on public.messages;
create policy "Members can insert text messages" on public.messages
  for insert with check (
    couple_id = public.get_my_couple_id()
    and kind = 'text'
    and author_id = auth.uid()
  );

drop policy if exists "Authors can edit their text messages" on public.messages;
create policy "Authors can edit their text messages" on public.messages
  for update using (author_id = auth.uid() and kind = 'text');

drop policy if exists "Authors can delete their text messages" on public.messages;
create policy "Authors can delete their text messages" on public.messages
  for delete using (author_id = auth.uid() and kind = 'text');

drop policy if exists "Members can view message reads" on public.message_reads;
create policy "Members can view message reads" on public.message_reads
  for select using (
    message_id in (select id from public.messages where couple_id = public.get_my_couple_id())
  );

drop policy if exists "Users track their own reads" on public.message_reads;
create policy "Users track their own reads" on public.message_reads
  for insert with check (user_id = auth.uid());

drop policy if exists "Members can view topics" on public.thread_topics;
create policy "Members can view topics" on public.thread_topics
  for select using (couple_id = public.get_my_couple_id());

drop policy if exists "Members can push topics" on public.thread_topics;
create policy "Members can push topics" on public.thread_topics
  for insert with check (couple_id = public.get_my_couple_id() and pushed_by = auth.uid());

drop policy if exists "Members can update topics" on public.thread_topics;
create policy "Members can update topics" on public.thread_topics
  for update using (couple_id = public.get_my_couple_id());

-- =========================================================================
-- Realtime : activer la publication sur les nouvelles tables
-- =========================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reads;
alter publication supabase_realtime add table public.thread_topics;
