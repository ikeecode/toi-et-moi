# Conversations unifiées + finitions mobile — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une surface conversationnelle unifiée (commentaires de souvenirs, chat rituel asynchrone, événements système) et une finition mobile sans barres de défilement.

**Architecture:** Une table `messages` polymorphe (contexts `memory` / `thread` / `main`) alimente une famille de composants `<Conversation>` partagés ; les modifications de souvenirs et le marquage "Discutée" génèrent des messages système via une fonction SQL `security definer`. Realtime via un canal unique `couple:<couple_id>` par couple.

**Tech Stack:** Next.js 16, React 19, Supabase (Postgres + Auth + Realtime), Tailwind v4, framer-motion, sonner, vitest pour les utilitaires purs.

**Spec de référence:** `docs/superpowers/specs/2026-04-19-conversations-and-mobile-polish-design.md`

**Rappel projet (AGENTS.md):** Cette version de Next.js a des breaking changes. Consulter `node_modules/next/dist/docs/` avant toute API non évidente. Les commits ne contiennent **pas** de Co-Authored-By (voir MEMORY.md).

---

## Conventions du plan

- Les tests automatisés couvrent les utilitaires purs (diff de souvenirs, construction de messages système). Les composants et parcours complets sont vérifiés manuellement à la fin.
- Toutes les commandes `git commit` utilisent des messages courts en français, style Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`) et **sans** attribution Claude.
- Chaque tâche termine par une étape commit. On ne regroupe pas plusieurs tâches dans un seul commit.
- `npx tsc --noEmit` est lancé en fin de chaque tâche qui touche du TypeScript pour confirmer qu'on ne casse rien.

---

## Task 1 : Installer Vitest et créer le premier test

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/__tests__/sanity.test.ts`

- [ ] **Step 1: Installer les dépendances de test**

Run:
```bash
npm install --save-dev vitest @vitest/ui
```

- [ ] **Step 2: Ajouter un script test dans package.json**

Dans `package.json`, ajouter sous `"scripts"` la ligne suivante juste après `"lint"` :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Créer la config Vitest**

Créer `vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Écrire un test sanity**

Créer `lib/__tests__/sanity.test.ts` :

```ts
import { describe, it, expect } from 'vitest';

describe('vitest sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Lancer les tests pour vérifier**

Run: `npm test`
Expected: `1 passed`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/__tests__/sanity.test.ts
git commit -m "chore: add vitest for pure-function tests"
```

---

## Task 2 : Migration SQL — tables messages / thread_topics / triggers / RLS

**Files:**
- Create: `supabase/migration_conversations.sql`

- [ ] **Step 1: Écrire la migration complète**

Créer `supabase/migration_conversations.sql` :

```sql
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
```

- [ ] **Step 2: Exécuter la migration**

Demander à l'utilisateur d'exécuter le fichier dans Supabase SQL Editor (le script est idempotent grâce à `if not exists` / `drop policy if exists`).

Attendu : pas d'erreur. Vérifier manuellement dans Supabase que les tables `messages`, `message_reads`, `thread_topics` existent et que `memories.updated_at` a été ajouté.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration_conversations.sql
git commit -m "feat(db): migration conversations unifiées + thread_topics"
```

---

## Task 3 : Types TypeScript partagés

**Files:**
- Create: `lib/conversations/types.ts`

- [ ] **Step 1: Créer le fichier de types**

Créer `lib/conversations/types.ts` :

```ts
export type ConversationContextType = 'memory' | 'thread' | 'main';

export type MessageKind = 'text' | 'system';

export interface MessageRow {
  id: string;
  couple_id: string;
  context_type: ConversationContextType;
  context_id: string | null;
  author_id: string | null;
  kind: MessageKind;
  body: string | null;
  metadata: MessageMetadata;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
}

export type MessageMetadata =
  | { event: 'memory.created' }
  | { event: 'memory.edited'; diff: MemoryDiff }
  | {
      event: 'topic.pushed';
      topicId: string;
      questionRef:
        | { kind: 'builtin'; index: number }
        | { kind: 'custom'; id: string };
      setNumber: 1 | 2 | 3 | 4;
      questionText: string;
    }
  | { event: 'topic.discussed'; topicId: string; by: string }
  | { event: 'topic.undiscussed'; topicId: string; by: string }
  | Record<string, never>; // pour les messages texte

export interface MemoryDiff {
  title?: { from: string; to: string };
  description?: { from: string | null; to: string | null };
  date?: { from: string; to: string };
  photosAdded?: number;
  photosRemoved?: number;
}

export interface ThreadTopicRow {
  id: string;
  couple_id: string;
  question_index: number | null;
  custom_question_id: string | null;
  pushed_by: string;
  pushed_at: string;
  discussed_at: string | null;
  discussed_by: string | null;
}

export interface MessageReadRow {
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface OptimisticMessage extends Omit<MessageRow, 'id'> {
  id: string; // id temporaire côté client
  status: 'sending' | 'sent' | 'failed';
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur (le fichier est autonome).

- [ ] **Step 3: Commit**

```bash
git add lib/conversations/types.ts
git commit -m "feat(conversations): types partagés pour messages et topics"
```

---

## Task 4 : Utilitaire pur — calcul du diff de souvenir

**Files:**
- Create: `lib/conversations/memory-diff.ts`
- Create: `lib/conversations/__tests__/memory-diff.test.ts`

- [ ] **Step 1: Écrire le test d'abord**

Créer `lib/conversations/__tests__/memory-diff.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { buildMemoryDiff } from '@/lib/conversations/memory-diff';

describe('buildMemoryDiff', () => {
  const baseBefore = {
    title: 'Balade',
    description: 'Parc',
    date: '2026-01-10',
    photoCount: 2,
  };

  it('retourne null quand rien ne change', () => {
    expect(buildMemoryDiff(baseBefore, baseBefore, { added: 0, removed: 0 })).toBeNull();
  });

  it('détecte un changement de titre uniquement', () => {
    const after = { ...baseBefore, title: 'Balade à vélo' };
    expect(buildMemoryDiff(baseBefore, after, { added: 0, removed: 0 })).toEqual({
      title: { from: 'Balade', to: 'Balade à vélo' },
    });
  });

  it('détecte l\'ajout et la suppression de photos', () => {
    expect(
      buildMemoryDiff(baseBefore, baseBefore, { added: 2, removed: 1 })
    ).toEqual({
      photosAdded: 2,
      photosRemoved: 1,
    });
  });

  it('gère la description passée de null à valeur', () => {
    const before = { ...baseBefore, description: null };
    const after = { ...baseBefore, description: 'Ensoleillé' };
    expect(buildMemoryDiff(before, after, { added: 0, removed: 0 })).toEqual({
      description: { from: null, to: 'Ensoleillé' },
    });
  });

  it('combine plusieurs changements', () => {
    const after = { ...baseBefore, title: 'Autre', date: '2026-02-01' };
    expect(buildMemoryDiff(baseBefore, after, { added: 1, removed: 0 })).toEqual({
      title: { from: 'Balade', to: 'Autre' },
      date: { from: '2026-01-10', to: '2026-02-01' },
      photosAdded: 1,
    });
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/conversations/memory-diff'`

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `lib/conversations/memory-diff.ts` :

```ts
import type { MemoryDiff } from './types';

export interface MemorySnapshot {
  title: string;
  description: string | null;
  date: string;
  photoCount: number;
}

export function buildMemoryDiff(
  before: MemorySnapshot,
  after: MemorySnapshot,
  photos: { added: number; removed: number }
): MemoryDiff | null {
  const diff: MemoryDiff = {};

  if (before.title !== after.title) {
    diff.title = { from: before.title, to: after.title };
  }
  if (before.description !== after.description) {
    diff.description = { from: before.description, to: after.description };
  }
  if (before.date !== after.date) {
    diff.date = { from: before.date, to: after.date };
  }
  if (photos.added > 0) {
    diff.photosAdded = photos.added;
  }
  if (photos.removed > 0) {
    diff.photosRemoved = photos.removed;
  }

  return Object.keys(diff).length === 0 ? null : diff;
}
```

- [ ] **Step 4: Relancer le test**

Run: `npm test`
Expected: tous verts.

- [ ] **Step 5: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 6: Commit**

```bash
git add lib/conversations/memory-diff.ts lib/conversations/__tests__/memory-diff.test.ts
git commit -m "feat(conversations): utilitaire diff de souvenir avec tests"
```

---

## Task 5 : Server actions — messages (postMessage, editMessage, deleteMessage, markMessageRead)

**Files:**
- Create: `app/conversations/actions.ts`

- [ ] **Step 1: Écrire les actions**

Créer `app/conversations/actions.ts` :

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ConversationContextType } from '@/lib/conversations/types';

async function getCurrentCouple() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Vous devez être connecté.');

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!member) throw new Error('Aucun espace couple trouvé.');

  return { supabase, user, coupleId: member.couple_id as string };
}

export async function postMessage(params: {
  contextType: ConversationContextType;
  contextId: string | null;
  body: string;
}) {
  const body = params.body.trim();
  if (body.length === 0) throw new Error('Message vide.');
  if (body.length > 4000) throw new Error('Message trop long.');

  const { supabase, user, coupleId } = await getCurrentCouple();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      couple_id: coupleId,
      context_type: params.contextType,
      context_id: params.contextType === 'main' ? null : params.contextId,
      author_id: user.id,
      kind: 'text',
      body,
    })
    .select()
    .single();

  if (error || !data) throw new Error("Impossible d'envoyer le message.");

  return data;
}

export async function editMessage(messageId: string, body: string) {
  const trimmed = body.trim();
  if (trimmed.length === 0) throw new Error('Message vide.');
  if (trimmed.length > 4000) throw new Error('Message trop long.');

  const { supabase } = await getCurrentCouple();

  const { error } = await supabase
    .from('messages')
    .update({ body: trimmed, edited_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw new Error('Impossible de modifier ce message.');
}

export async function deleteMessage(messageId: string) {
  const { supabase } = await getCurrentCouple();
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw new Error('Impossible de supprimer ce message.');
}

export async function markMessageRead(messageId: string) {
  const { supabase, user } = await getCurrentCouple();

  const { error } = await supabase
    .from('message_reads')
    .insert({ message_id: messageId, user_id: user.id });

  // 23505 = déjà lu, OK
  if (error && error.code !== '23505') {
    console.error('markMessageRead error', error);
  }
}

export async function revalidateConversation(contextType: ConversationContextType) {
  if (contextType === 'main') revalidatePath('/questions');
  else if (contextType === 'memory') revalidatePath('/memories/[id]', 'page');
  else if (contextType === 'thread') revalidatePath('/questions');
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add app/conversations/actions.ts
git commit -m "feat(conversations): actions serveur messages"
```

---

## Task 6 : Server actions — thread_topics (push, markDiscussed, unmark)

**Files:**
- Modify: `app/questions/actions.ts`
- Create: `app/questions/topics-actions.ts`
- Create: `lib/conversations/system-messages.ts`

- [ ] **Step 1: Créer un helper client pour `create_system_message`**

Créer `lib/conversations/system-messages.ts` :

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MessageMetadata } from './types';

export async function insertSystemMessage(
  supabase: SupabaseClient,
  params: {
    coupleId: string;
    contextType: 'memory' | 'thread' | 'main';
    contextId: string | null;
    event: string;
    metadata?: Record<string, unknown>;
    authorId?: string | null;
  }
) {
  const { data, error } = await supabase.rpc('create_system_message', {
    p_couple_id: params.coupleId,
    p_context_type: params.contextType,
    p_context_id: params.contextId,
    p_event: params.event,
    p_metadata: params.metadata ?? {},
    p_author_id: params.authorId ?? null,
  });

  if (error) throw error;
  return data as string;
}

export function narrowMetadata<K extends MessageMetadata['event']>(
  metadata: Record<string, unknown>,
  event: K
): Extract<MessageMetadata, { event: K }> | null {
  if (metadata?.event === event) {
    return metadata as Extract<MessageMetadata, { event: K }>;
  }
  return null;
}
```

- [ ] **Step 2: Créer les actions topics**

Créer `app/questions/topics-actions.ts` :

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { insertSystemMessage } from '@/lib/conversations/system-messages';
import { QUESTIONS } from '@/lib/questions';

async function getCurrentCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Vous devez être connecté.');
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();
  if (!member) throw new Error('Aucun espace couple trouvé.');
  return { supabase, user, coupleId: member.couple_id as string };
}

export async function pushTopic(params: {
  questionIndex?: number;
  customQuestionId?: string;
}) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  let questionText: string;
  let setNumber: 1 | 2 | 3 | 4;

  if (params.questionIndex !== undefined) {
    const q = QUESTIONS.find((item) => item.index === params.questionIndex);
    if (!q) throw new Error('Question introuvable.');
    questionText = q.text;
    setNumber = q.set;
  } else if (params.customQuestionId) {
    const { data: cq } = await supabase
      .from('custom_questions')
      .select('text')
      .eq('id', params.customQuestionId)
      .single();
    if (!cq) throw new Error('Question introuvable.');
    questionText = cq.text;
    setNumber = 4;
  } else {
    throw new Error('Aucune question fournie.');
  }

  const { data: topic, error } = await supabase
    .from('thread_topics')
    .insert({
      couple_id: coupleId,
      question_index: params.questionIndex ?? null,
      custom_question_id: params.customQuestionId ?? null,
      pushed_by: user.id,
    })
    .select()
    .single();

  if (error || !topic) {
    if (error?.code === '23505') {
      const { data: existing } = await supabase
        .from('thread_topics')
        .select('*')
        .eq('couple_id', coupleId)
        .eq(params.questionIndex !== undefined ? 'question_index' : 'custom_question_id',
            params.questionIndex ?? params.customQuestionId!)
        .single();
      if (existing) return existing;
    }
    throw new Error('Impossible de pousser cette question.');
  }

  await insertSystemMessage(supabase, {
    coupleId,
    contextType: 'main',
    contextId: null,
    event: 'topic.pushed',
    metadata: {
      topicId: topic.id,
      questionRef:
        params.questionIndex !== undefined
          ? { kind: 'builtin', index: params.questionIndex }
          : { kind: 'custom', id: params.customQuestionId },
      setNumber,
      questionText,
    },
    authorId: user.id,
  });

  revalidatePath('/questions');
  return topic;
}

export async function markTopicDiscussed(topicId: string) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const { data: updated, error } = await supabase
    .from('thread_topics')
    .update({ discussed_at: new Date().toISOString(), discussed_by: user.id })
    .eq('id', topicId)
    .select()
    .single();

  if (error || !updated) throw new Error('Impossible de marquer comme discutée.');

  // Compat : alimenter questions_progress pour que l'ancien compteur reste cohérent
  await supabase.from('questions_progress').insert({
    couple_id: coupleId,
    question_index: updated.question_index,
    custom_question_id: updated.custom_question_id,
    completed_by: user.id,
  });

  // Message système dans le thread et dans le fil principal
  await Promise.all([
    insertSystemMessage(supabase, {
      coupleId,
      contextType: 'thread',
      contextId: topicId,
      event: 'topic.discussed',
      metadata: { topicId, by: user.id },
      authorId: user.id,
    }),
    insertSystemMessage(supabase, {
      coupleId,
      contextType: 'main',
      contextId: null,
      event: 'topic.discussed',
      metadata: { topicId, by: user.id },
      authorId: user.id,
    }),
  ]);

  revalidatePath('/questions');
  return updated;
}

export async function unmarkTopicDiscussed(topicId: string) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const { data: topic } = await supabase
    .from('thread_topics')
    .select('*')
    .eq('id', topicId)
    .single();
  if (!topic) throw new Error('Sujet introuvable.');

  await supabase
    .from('thread_topics')
    .update({ discussed_at: null, discussed_by: null })
    .eq('id', topicId);

  // Compat : retirer la ligne de questions_progress
  if (topic.question_index !== null) {
    await supabase
      .from('questions_progress')
      .delete()
      .eq('couple_id', coupleId)
      .eq('question_index', topic.question_index);
  } else if (topic.custom_question_id) {
    await supabase
      .from('questions_progress')
      .delete()
      .eq('couple_id', coupleId)
      .eq('custom_question_id', topic.custom_question_id);
  }

  await insertSystemMessage(supabase, {
    coupleId,
    contextType: 'thread',
    contextId: topicId,
    event: 'topic.undiscussed',
    metadata: { topicId, by: user.id },
    authorId: user.id,
  });

  revalidatePath('/questions');
}

export async function backfillTopicsFromProgress() {
  const { supabase, coupleId } = await getCurrentCouple();

  const { data: legacy } = await supabase
    .from('questions_progress')
    .select('*')
    .eq('couple_id', coupleId);

  if (!legacy || legacy.length === 0) return;

  for (const row of legacy) {
    await supabase
      .from('thread_topics')
      .insert({
        couple_id: coupleId,
        question_index: row.question_index,
        custom_question_id: row.custom_question_id,
        pushed_by: row.completed_by,
        pushed_at: row.completed_at,
        discussed_at: row.completed_at,
        discussed_by: row.completed_by,
      })
      .select()
      .single()
      .then(() => undefined, () => undefined); // ignore 23505 conflicts
  }
}
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 4: Commit**

```bash
git add app/questions/topics-actions.ts lib/conversations/system-messages.ts
git commit -m "feat(questions): actions pushTopic / mark / unmark / backfill"
```

---

## Task 7 : Étendre `updateMemory` pour émettre un message système

**Files:**
- Modify: `app/memories/actions.ts`

- [ ] **Step 1: Remplacer le contenu de `app/memories/actions.ts`**

Remplacer l'intégralité de `app/memories/actions.ts` par :

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateImageUpload } from '@/lib/image-upload';
import { insertSystemMessage } from '@/lib/conversations/system-messages';
import { buildMemoryDiff } from '@/lib/conversations/memory-diff';

async function getCurrentCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Vous devez être connecté.');
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();
  if (!member) throw new Error('Aucun espace couple trouvé.');
  return { supabase, user, coupleId: member.couple_id as string };
}

export async function createMemory(formData: FormData) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const images = (formData.getAll('images') as File[]).filter(
    (image) => image && image.size > 0
  );

  if (!title || !date) throw new Error('Le titre et la date sont requis.');

  const validationError = validateImageUpload(images);
  if (validationError) throw new Error(validationError);

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      couple_id: coupleId,
      title,
      description: description || null,
      date,
      created_by: user.id,
    })
    .select()
    .single();

  if (memoryError || !memory) throw new Error('Impossible de créer ce souvenir.');

  for (const image of images) {
    const fileExt = image.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${coupleId}/${memory.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filePath, image);
    if (uploadError) {
      console.error('Upload error:', uploadError);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('memories').getPublicUrl(filePath);

    await supabase.from('memory_photos').insert({
      memory_id: memory.id,
      image_url: publicUrl,
    });
  }

  await insertSystemMessage(supabase, {
    coupleId,
    contextType: 'memory',
    contextId: memory.id,
    event: 'memory.created',
    metadata: {},
    authorId: user.id,
  });

  revalidatePath('/memories');
  return memory;
}

export async function updateMemory(formData: FormData) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const memoryId = formData.get('memoryId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const removedPhotoIds = formData.getAll('removedPhotoIds') as string[];
  const newImages = (formData.getAll('newImages') as File[]).filter(
    (image) => image && image.size > 0
  );

  if (!memoryId || !title || !date) throw new Error('Le titre et la date sont requis.');

  const { data: before } = await supabase
    .from('memories')
    .select('id, title, description, date')
    .eq('id', memoryId)
    .eq('couple_id', coupleId)
    .single();
  if (!before) throw new Error('Souvenir introuvable.');

  const { count: beforePhotoCount } = await supabase
    .from('memory_photos')
    .select('id', { count: 'exact', head: true })
    .eq('memory_id', memoryId);

  await supabase
    .from('memories')
    .update({
      title,
      description: description || null,
      date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memoryId);

  let photosRemoved = 0;
  if (removedPhotoIds.length > 0) {
    const { data: photosToRemove } = await supabase
      .from('memory_photos')
      .select('id, image_url')
      .in('id', removedPhotoIds);

    if (photosToRemove && photosToRemove.length > 0) {
      const storagePaths = photosToRemove
        .map((p) => {
          const match = p.image_url.match(/\/memories\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (storagePaths.length > 0) {
        await supabase.storage.from('memories').remove(storagePaths);
      }
      await supabase.from('memory_photos').delete().in('id', removedPhotoIds);
      photosRemoved = photosToRemove.length;
    }
  }

  let photosAdded = 0;
  if (newImages.length > 0) {
    const validationError = validateImageUpload(newImages);
    if (validationError) throw new Error(validationError);

    for (const image of newImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${coupleId}/${memoryId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, image);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('memories').getPublicUrl(filePath);
      await supabase.from('memory_photos').insert({
        memory_id: memoryId,
        image_url: publicUrl,
      });
      photosAdded += 1;
    }
  }

  const diff = buildMemoryDiff(
    {
      title: before.title,
      description: before.description,
      date: before.date,
      photoCount: beforePhotoCount ?? 0,
    },
    {
      title,
      description: description || null,
      date,
      photoCount: (beforePhotoCount ?? 0) - photosRemoved + photosAdded,
    },
    { added: photosAdded, removed: photosRemoved }
  );

  if (diff) {
    await insertSystemMessage(supabase, {
      coupleId,
      contextType: 'memory',
      contextId: memoryId,
      event: 'memory.edited',
      metadata: { diff },
      authorId: user.id,
    });
  }

  revalidatePath('/memories');
  revalidatePath(`/memories/${memoryId}`);
}

export async function deleteMemory(formData: FormData) {
  const { supabase, coupleId } = await getCurrentCouple();

  const memoryId = formData.get('memoryId') as string;
  if (!memoryId) throw new Error("L'identifiant du souvenir est requis.");

  const { data: memory } = await supabase
    .from('memories')
    .select('id, couple_id')
    .eq('id', memoryId)
    .eq('couple_id', coupleId)
    .single();
  if (!memory) throw new Error('Souvenir introuvable.');

  const storagePath = `${coupleId}/${memoryId}`;
  const { data: files } = await supabase.storage
    .from('memories')
    .list(storagePath);
  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${storagePath}/${file.name}`);
    await supabase.storage.from('memories').remove(filePaths);
  }

  await supabase.from('memory_photos').delete().eq('memory_id', memoryId);
  await supabase.from('memories').delete().eq('id', memoryId);
  // messages cleanup via trigger

  revalidatePath('/memories');
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add app/memories/actions.ts
git commit -m "feat(memories): créer des messages système à la création/modif"
```

---

## Task 8 : Cacher les barres de défilement (mobile polish)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Ajouter les règles CSS**

Dans `app/globals.css`, à la fin du bloc `@layer utilities` (juste avant sa `}` fermante), ajouter :

```css
  html,
  body {
    scrollbar-width: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
  * {
    -ms-overflow-style: none;
  }
```

- [ ] **Step 2: Vérifier en dev**

Run: `npm run dev`
Ouvrir `http://localhost:3000` et vérifier :
- aucune scrollbar visible desktop
- le scroll molette/touchpad fonctionne
- le scroll touch fonctionne (DevTools device mode)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): cacher les barres de défilement (mobile polish)"
```

---

## Task 9 : Composant `<MessageBubble>`

**Files:**
- Create: `components/custom/conversation/message-bubble.tsx`

- [ ] **Step 1: Écrire le composant**

Créer `components/custom/conversation/message-bubble.tsx` :

```tsx
'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import type { MessageRow } from '@/lib/conversations/types';

interface MessageBubbleProps {
  message: MessageRow;
  isOwn: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  readByOther: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export function MessageBubble({
  message,
  isOwn,
  isGroupStart,
  isGroupEnd,
  readByOther,
  status,
}: MessageBubbleProps) {
  const [showTime, setShowTime] = useState(false);

  const ownCorners = cn(
    'rounded-[1.25rem]',
    isGroupStart && isGroupEnd && 'rounded-[1.25rem]',
    isGroupStart && !isGroupEnd && 'rounded-br-md',
    !isGroupStart && isGroupEnd && 'rounded-tr-md',
    !isGroupStart && !isGroupEnd && 'rounded-tr-md rounded-br-md'
  );

  const otherCorners = cn(
    'rounded-[1.25rem]',
    isGroupStart && !isGroupEnd && 'rounded-bl-md',
    !isGroupStart && isGroupEnd && 'rounded-tl-md',
    !isGroupStart && !isGroupEnd && 'rounded-tl-md rounded-bl-md'
  );

  return (
    <div
      className={cn(
        'flex w-full',
        isOwn ? 'justify-end' : 'justify-start',
        isGroupEnd ? 'mb-2' : 'mb-0.5'
      )}
    >
      <div className={cn('flex flex-col gap-1 max-w-[78%]', isOwn ? 'items-end' : 'items-start')}>
        <button
          type="button"
          onClick={() => setShowTime((v) => !v)}
          className={cn(
            'text-left px-3.5 py-2 text-[0.92rem] leading-snug transition-colors',
            isOwn
              ? cn(
                  'bg-[linear-gradient(180deg,#a7bfff,#7ea0ff)] text-[#09111f]',
                  ownCorners
                )
              : cn('bg-white/[0.06] text-foreground border border-white/10', otherCorners),
            status === 'sending' && 'opacity-70',
            status === 'failed' && 'border-red-400/40 text-red-100'
          )}
        >
          {message.body}
        </button>
        {isGroupEnd && (
          <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            {showTime && (
              <span>
                {formatDistanceToNow(new Date(message.created_at), {
                  locale: fr,
                  addSuffix: true,
                })}
              </span>
            )}
            {isOwn && status !== 'failed' && (
              <span
                className={cn(
                  'text-[0.65rem]',
                  readByOther ? 'text-[#dbe7ff]' : 'text-muted-foreground'
                )}
              >
                {status === 'sending' ? '· envoi…' : readByOther ? '· Lu' : '· Envoyé'}
              </span>
            )}
            {status === 'failed' && <span className="text-red-300">· Échec</span>}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add components/custom/conversation/message-bubble.tsx
git commit -m "feat(conversation): composant MessageBubble style iMessage"
```

---

## Task 10 : Composant `<SystemEvent>`

**Files:**
- Create: `components/custom/conversation/system-event.tsx`

- [ ] **Step 1: Écrire le composant**

Créer `components/custom/conversation/system-event.tsx` :

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MessageRow, MemoryDiff } from '@/lib/conversations/types';

interface SystemEventProps {
  message: MessageRow;
  currentUserId: string;
  authorName: string;
  onOpenTopicThread?: (topicId: string) => void;
  onMarkTopicDiscussed?: (topicId: string) => void;
}

export function SystemEvent({
  message,
  currentUserId,
  authorName,
  onOpenTopicThread,
  onMarkTopicDiscussed,
}: SystemEventProps) {
  const meta = message.metadata as { event?: string } & Record<string, unknown>;

  if (meta.event === 'memory.created') {
    return (
      <SystemLine>
        <span>Souvenir créé {formatRel(message.created_at)}</span>
      </SystemLine>
    );
  }

  if (meta.event === 'memory.edited') {
    const diff = (meta as { diff: MemoryDiff }).diff;
    return <EditedEvent message={message} diff={diff} authorName={authorName} />;
  }

  if (meta.event === 'topic.pushed') {
    return (
      <TopicPushedCard
        message={message}
        currentUserId={currentUserId}
        authorName={authorName}
        onOpen={onOpenTopicThread}
        onMark={onMarkTopicDiscussed}
      />
    );
  }

  if (meta.event === 'topic.discussed') {
    return (
      <SystemLine>
        <span>Question marquée discutée {formatRel(message.created_at)}</span>
      </SystemLine>
    );
  }

  if (meta.event === 'topic.undiscussed') {
    return (
      <SystemLine>
        <span>Réouverture de la discussion {formatRel(message.created_at)}</span>
      </SystemLine>
    );
  }

  return null;
}

function SystemLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
        {children}
      </span>
    </div>
  );
}

function formatRel(iso: string) {
  return formatDistanceToNow(new Date(iso), { locale: fr, addSuffix: true });
}

function EditedEvent({
  message,
  diff,
  authorName,
}: {
  message: MessageRow;
  diff: MemoryDiff;
  authorName: string;
}) {
  const [open, setOpen] = useState(false);
  const hasAny =
    diff.title || diff.description || diff.date || diff.photosAdded || diff.photosRemoved;

  if (!hasAny) return null;

  return (
    <div className="my-3 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="soft-chip text-[0.72rem]"
      >
        {authorName} a modifié ce souvenir · {formatRel(message.created_at)}
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && (
        <div className="surface-panel-soft w-full max-w-md space-y-2 rounded-[1.25rem] px-4 py-3 text-xs">
          {diff.title && (
            <DiffRow label="Titre" from={diff.title.from} to={diff.title.to} />
          )}
          {diff.description && (
            <DiffRow
              label="Description"
              from={diff.description.from ?? '(vide)'}
              to={diff.description.to ?? '(vide)'}
            />
          )}
          {diff.date && (
            <DiffRow label="Date" from={diff.date.from} to={diff.date.to} />
          )}
          {diff.photosAdded && (
            <p className="text-muted-foreground">+{diff.photosAdded} photo(s)</p>
          )}
          {diff.photosRemoved && (
            <p className="text-muted-foreground">−{diff.photosRemoved} photo(s)</p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffRow({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div>
      <p className="section-kicker">{label}</p>
      <p className="mt-1 text-muted-foreground line-through">{from}</p>
      <p className="text-foreground">{to}</p>
    </div>
  );
}

function TopicPushedCard({
  message,
  currentUserId,
  authorName,
  onOpen,
  onMark,
}: {
  message: MessageRow;
  currentUserId: string;
  authorName: string;
  onOpen?: (topicId: string) => void;
  onMark?: (topicId: string) => void;
}) {
  const meta = message.metadata as {
    topicId: string;
    questionText: string;
    setNumber: 1 | 2 | 3 | 4;
  };
  const setLabel: Record<1 | 2 | 3 | 4, string> = { 1: 'I', 2: 'II', 3: 'III', 4: '+' };

  return (
    <div
      className={cn(
        'my-3 mx-auto w-full max-w-md rounded-[1.4rem] border border-white/10',
        'bg-[linear-gradient(180deg,rgba(143,178,255,0.08),rgba(143,178,255,0.02))] p-4'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="accent-chip">{setLabel[meta.setNumber]}</span>
        <span className="text-[0.65rem] text-muted-foreground">
          {authorName} · {formatRel(message.created_at)}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-foreground">
        {meta.questionText}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(meta.topicId)}
          className="cta-primary h-10 flex-1 px-4 text-[0.82rem]"
        >
          Ouvrir la discussion
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add components/custom/conversation/system-event.tsx
git commit -m "feat(conversation): composant SystemEvent (modifs + topic cards)"
```

---

## Task 10 bis : Composants `<TypingIndicator>` et `<ReadReceipt>` (intégrés ailleurs)

*(Note: `ReadReceipt` est déjà intégré dans `MessageBubble` via le statut `isOwn + readByOther`. Ce task crée uniquement le TypingIndicator.)*

**Files:**
- Create: `components/custom/conversation/typing-indicator.tsx`

- [ ] **Step 1: Écrire le composant**

Créer `components/custom/conversation/typing-indicator.tsx` :

```tsx
'use client';

import { motion } from 'framer-motion';

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-current"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span>{name} écrit…</span>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/custom/conversation/typing-indicator.tsx
git commit -m "feat(conversation): TypingIndicator animé"
```

---

## Task 11 : Composer `<Composer>` (textarea auto-grow + bouton envoyer + slot)

**Files:**
- Create: `components/custom/conversation/composer.tsx`

- [ ] **Step 1: Écrire le composant**

Créer `components/custom/conversation/composer.tsx` :

```tsx
'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (body: string) => Promise<void> | void;
  onTyping?: () => void;
  leftSlot?: ReactNode;
  placeholder?: string;
}

export function Composer({ onSend, onTyping, leftSlot, placeholder }: ComposerProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue('');
    } finally {
      setSending(false);
    }
  }

  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    } else if (onTyping) {
      onTyping();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 rounded-[1.4rem] border border-white/10 bg-[#151922]/78 p-2 backdrop-blur-xl"
    >
      {leftSlot}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder ?? 'Message…'}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-[1rem] bg-transparent px-3 py-2 text-sm text-foreground',
          'placeholder:text-muted-foreground focus:outline-none'
        )}
      />
      <button
        type="submit"
        disabled={sending || value.trim().length === 0}
        aria-label="Envoyer"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'bg-[linear-gradient(180deg,#a7bfff,#7ea0ff)] text-[#09111f]',
          'disabled:opacity-40'
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/custom/conversation/composer.tsx
git commit -m "feat(conversation): composant Composer"
```

---

## Task 12 : Context provider Realtime partagé

**Files:**
- Create: `components/custom/conversation/realtime-provider.tsx`
- Create: `components/custom/conversation/use-conversation-channel.ts`

- [ ] **Step 1: Créer le provider**

Créer `components/custom/conversation/realtime-provider.tsx` :

```tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextValue {
  channel: RealtimeChannel | null;
  coupleId: string;
  userId: string;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({
  coupleId,
  userId,
  children,
}: {
  coupleId: string;
  userId: string;
  children: ReactNode;
}) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`couple:${coupleId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        () => { /* handled by consumers via use-conversation-channel */ })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'thread_topics', filter: `couple_id=eq.${coupleId}` },
        () => {})
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        () => {})
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [coupleId, userId]);

  const value = useMemo(
    () => ({ channel: channelRef.current, coupleId, userId }),
    [coupleId, userId]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider');
  return ctx;
}
```

- [ ] **Step 2: Créer le hook de consommation**

Créer `components/custom/conversation/use-conversation-channel.ts` :

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MessageRow, ConversationContextType } from '@/lib/conversations/types';

interface UseConversationChannelArgs {
  coupleId: string;
  userId: string;
  contextType: ConversationContextType;
  contextId: string | null;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>; // messageId -> userIds
}

export function useConversationChannel(args: UseConversationChannelArgs) {
  const [messages, setMessages] = useState<MessageRow[]>(args.initialMessages);
  const [reads, setReads] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    for (const [mid, uids] of Object.entries(args.initialReads)) {
      map[mid] = new Set(uids);
    }
    return map;
  });
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      `couple:${args.coupleId}:${args.contextType}:${args.contextId ?? 'main'}`
    );

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${args.coupleId}`,
        },
        (payload: RealtimePostgresChangesPayload<MessageRow>) => {
          const row = payload.new as MessageRow;
          if (row.context_type !== args.contextType) return;
          if (args.contextType !== 'main' && row.context_id !== args.contextId) return;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string };
          setReads((prev) => {
            const next = { ...prev };
            const set = new Set(next[row.message_id] ?? []);
            set.add(row.user_id);
            next[row.message_id] = set;
            return next;
          });
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (
          payload &&
          payload.contextType === args.contextType &&
          payload.contextId === args.contextId &&
          payload.userId !== args.userId
        ) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.add(payload.userId);
            return next;
          });
          window.setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(payload.userId);
              return next;
            });
          }, 2500);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [args.coupleId, args.userId, args.contextType, args.contextId]);

  function broadcastTyping() {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        contextType: args.contextType,
        contextId: args.contextId,
        userId: args.userId,
      },
    });
  }

  return { messages, reads, typingUsers, setMessages, broadcastTyping };
}
```

- [ ] **Step 3: Vérifier compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/custom/conversation/realtime-provider.tsx components/custom/conversation/use-conversation-channel.ts
git commit -m "feat(conversation): hook realtime + provider"
```

---

## Task 13 : Composant `<Conversation>` orchestrateur

**Files:**
- Create: `components/custom/conversation/conversation.tsx`
- Create: `components/custom/conversation/message-list.tsx`

- [ ] **Step 1: Écrire MessageList**

Créer `components/custom/conversation/message-list.tsx` :

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { SystemEvent } from './system-event';
import type { MessageRow, OptimisticMessage } from '@/lib/conversations/types';

interface MessageListProps {
  messages: (MessageRow | OptimisticMessage)[];
  currentUserId: string;
  otherUserId: string | null;
  reads: Record<string, Set<string>>;
  authorNameById: Record<string, string>;
  onOpenTopicThread?: (topicId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  otherUserId,
  reads,
  authorNameById,
  onOpenTopicThread,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col px-1 py-2">
      {messages.map((message, index) => {
        if (message.kind === 'system') {
          return (
            <SystemEvent
              key={message.id}
              message={message as MessageRow}
              currentUserId={currentUserId}
              authorName={authorNameById[message.author_id ?? ''] ?? 'Quelqu’un'}
              onOpenTopicThread={onOpenTopicThread}
            />
          );
        }

        const prev = messages[index - 1];
        const next = messages[index + 1];
        const isGroupStart =
          !prev || prev.author_id !== message.author_id || prev.kind === 'system';
        const isGroupEnd =
          !next || next.author_id !== message.author_id || next.kind === 'system';
        const isOwn = message.author_id === currentUserId;
        const readByOther =
          isOwn && otherUserId ? reads[message.id]?.has(otherUserId) ?? false : false;
        const status = (message as OptimisticMessage).status;

        return (
          <MessageBubble
            key={message.id}
            message={message as MessageRow}
            isOwn={isOwn}
            isGroupStart={isGroupStart}
            isGroupEnd={isGroupEnd}
            readByOther={readByOther}
            status={status}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Écrire Conversation**

Créer `components/custom/conversation/conversation.tsx` :

```tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { TypingIndicator } from './typing-indicator';
import { useConversationChannel } from './use-conversation-channel';
import {
  postMessage,
  markMessageRead,
} from '@/app/conversations/actions';
import type {
  ConversationContextType,
  MessageRow,
  OptimisticMessage,
} from '@/lib/conversations/types';

interface ConversationProps {
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  contextType: ConversationContextType;
  contextId: string | null;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>;
  authorNameById: Record<string, string>;
  composerSlot?: ReactNode;
  placeholder?: string;
  onOpenTopicThread?: (topicId: string) => void;
}

export function Conversation(props: ConversationProps) {
  const { messages, reads, typingUsers, setMessages, broadcastTyping } =
    useConversationChannel({
      coupleId: props.coupleId,
      userId: props.currentUserId,
      contextType: props.contextType,
      contextId: props.contextId,
      initialMessages: props.initialMessages,
      initialReads: props.initialReads,
    });

  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);

  const combined = useMemo(() => {
    const list: (MessageRow | OptimisticMessage)[] = [...messages];
    for (const opt of optimistic) {
      if (!messages.some((m) => m.id === opt.id)) list.push(opt);
    }
    return list.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  }, [messages, optimistic]);

  const readTrackedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const message of messages) {
      if (
        message.author_id &&
        message.author_id !== props.currentUserId &&
        !readTrackedRef.current.has(message.id)
      ) {
        readTrackedRef.current.add(message.id);
        markMessageRead(message.id).catch(() => undefined);
      }
    }
  }, [messages, props.currentUserId]);

  const handleSend = useCallback(
    async (body: string) => {
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nowIso = new Date().toISOString();
      const optimisticMessage: OptimisticMessage = {
        id: tempId,
        couple_id: props.coupleId,
        context_type: props.contextType,
        context_id: props.contextId,
        author_id: props.currentUserId,
        kind: 'text',
        body,
        metadata: {},
        reply_to: null,
        created_at: nowIso,
        edited_at: null,
        status: 'sending',
      };
      setOptimistic((prev) => [...prev, optimisticMessage]);

      try {
        const inserted = await postMessage({
          contextType: props.contextType,
          contextId: props.contextId,
          body,
        });
        setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
        setMessages((prev) =>
          prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted as MessageRow]
        );
      } catch (error) {
        setOptimistic((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
        toast.error(error instanceof Error ? error.message : 'Échec d’envoi.');
      }
    },
    [props.coupleId, props.contextId, props.contextType, props.currentUserId, setMessages]
  );

  const someoneTyping = typingUsers.size > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={combined}
          currentUserId={props.currentUserId}
          otherUserId={props.otherUserId}
          reads={reads}
          authorNameById={props.authorNameById}
          onOpenTopicThread={props.onOpenTopicThread}
        />
        {someoneTyping && props.otherUserId && (
          <TypingIndicator
            name={props.authorNameById[props.otherUserId] ?? 'Partenaire'}
          />
        )}
      </div>
      <div className="pt-2">
        <Composer
          onSend={handleSend}
          onTyping={broadcastTyping}
          leftSlot={props.composerSlot}
          placeholder={props.placeholder}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Vérifier compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/custom/conversation/conversation.tsx components/custom/conversation/message-list.tsx
git commit -m "feat(conversation): orchestrateur Conversation + MessageList"
```

---

## Task 14 : Modale `<PickQuestionDialog>`

**Files:**
- Create: `components/custom/pick-question-dialog.tsx`

- [ ] **Step 1: Écrire le composant**

Créer `components/custom/pick-question-dialog.tsx` :

```tsx
'use client';

import { useState, useTransition } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { QUESTIONS, type Question } from '@/lib/questions';
import { pushTopic } from '@/app/questions/topics-actions';

interface CustomQuestion {
  id: string;
  text: string;
}

interface PickQuestionDialogProps {
  customQuestions: CustomQuestion[];
  pushedBuiltinIndices: number[];
  pushedCustomIds: string[];
  trigger: React.ReactNode;
  onPushed?: () => void;
}

export function PickQuestionDialog({
  customQuestions,
  pushedBuiltinIndices,
  pushedCustomIds,
  trigger,
  onPushed,
}: PickQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<1 | 2 | 3 | 4>(1);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const builtinFiltered: Question[] = QUESTIONS.filter((q) => q.set === tab).filter(
    (q) => q.text.toLowerCase().includes(search.toLowerCase())
  );
  const customFiltered = customQuestions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

  function handlePick(
    kind: 'builtin' | 'custom',
    ref: { questionIndex?: number; customQuestionId?: string }
  ) {
    startTransition(async () => {
      try {
        await pushTopic(ref);
        toast.success('Question ajoutée au fil.');
        setOpen(false);
        onPushed?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible de pousser la question.'
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Piocher une question</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {([1, 2, 3, 4] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={cn(
                'flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                tab === s ? 'bg-white text-[#0b0d12]' : 'text-muted-foreground'
              )}
            >
              {s === 4 ? '+' : s === 1 ? 'I' : s === 2 ? 'II' : 'III'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher…"
            className="h-10 w-full rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm focus:outline-none"
          />
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {tab !== 4 &&
            builtinFiltered.map((q) => {
              const pushed = pushedBuiltinIndices.includes(q.index);
              return (
                <button
                  key={q.index}
                  type="button"
                  disabled={pushed || isPending}
                  onClick={() => handlePick('builtin', { questionIndex: q.index })}
                  className={cn(
                    'block w-full rounded-[1.1rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm transition-colors',
                    pushed ? 'opacity-50' : 'hover:bg-white/[0.06]'
                  )}
                >
                  <span className="text-foreground">{q.text}</span>
                  {pushed && (
                    <span className="ml-2 text-xs text-muted-foreground">· déjà poussée</span>
                  )}
                </button>
              );
            })}
          {tab === 4 &&
            customFiltered.map((q) => {
              const pushed = pushedCustomIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={pushed || isPending}
                  onClick={() => handlePick('custom', { customQuestionId: q.id })}
                  className={cn(
                    'block w-full rounded-[1.1rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm transition-colors',
                    pushed ? 'opacity-50' : 'hover:bg-white/[0.06]'
                  )}
                >
                  <span className="text-foreground">{q.text}</span>
                  {pushed && (
                    <span className="ml-2 text-xs text-muted-foreground">· déjà poussée</span>
                  )}
                </button>
              );
            })}
          {tab === 4 && customFiltered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ajoutez vos propres questions depuis la carte « + » du fil.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PickQuestionButton() {
  return (
    <button
      type="button"
      aria-label="Piocher une question"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-foreground"
    >
      <Plus className="h-5 w-5" />
    </button>
  );
}
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/custom/pick-question-dialog.tsx
git commit -m "feat(questions): modale PickQuestionDialog"
```

---

## Task 15 : Page détail d'un souvenir `/memories/[id]`

**Files:**
- Create: `app/memories/[id]/page.tsx`
- Create: `app/memories/[id]/loading.tsx`
- Create: `components/custom/memory-detail-view.tsx`
- Modify: `components/custom/memory-card.tsx`

- [ ] **Step 1: Transformer la carte en lien et retirer les hover buttons**

Remplacer le contenu de `components/custom/memory-card.tsx` par :

```tsx
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/helpers';
import { ImageIcon } from 'lucide-react';

interface Photo {
  id: string;
  image_url: string;
}

interface MemoryCardProps {
  memory: {
    id: string;
    title: string;
    description: string | null;
    date: string;
  };
  coverPhoto: string | null;
  photos: Photo[];
}

export function MemoryCard({ memory, coverPhoto }: MemoryCardProps) {
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="group relative break-inside-avoid overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-[12px] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(216,154,130,0.12)]"
    >
      <div className="relative w-full overflow-hidden">
        {coverPhoto ? (
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={coverPhoto}
              alt={memory.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#130f0e] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[#8fb2ff]/12 via-[#151922] to-[#465a93]/12">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
          {memory.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatRelativeDate(memory.date)}
        </p>
        {memory.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {memory.description}
          </p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Créer la page détail**

Créer `app/memories/[id]/page.tsx` :

```tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MemoryDetailView } from '@/components/custom/memory-detail-view';
import { BottomNav } from '@/components/custom/bottom-nav';
import type { MessageRow } from '@/lib/conversations/types';

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();
  if (!member) redirect('/setup');

  const { data: memory } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .eq('couple_id', member.couple_id)
    .single();
  if (!memory) notFound();

  const { data: photos } = await supabase
    .from('memory_photos')
    .select('*')
    .eq('memory_id', id)
    .order('created_at', { ascending: true });

  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('couple_id', member.couple_id)
    .eq('context_type', 'memory')
    .eq('context_id', id)
    .order('created_at', { ascending: true });

  const messages: MessageRow[] = (messagesData ?? []) as MessageRow[];

  const messageIds = messages.map((m) => m.id);
  const { data: readsData } = messageIds.length
    ? await supabase.from('message_reads').select('*').in('message_id', messageIds)
    : { data: [] };

  const initialReads: Record<string, string[]> = {};
  for (const row of readsData ?? []) {
    const entry = row as { message_id: string; user_id: string };
    (initialReads[entry.message_id] ??= []).push(entry.user_id);
  }

  const { data: members } = await supabase
    .from('couple_members')
    .select('user_id, display_name, nickname')
    .eq('couple_id', member.couple_id);

  const authorNameById: Record<string, string> = {};
  for (const m of members ?? []) {
    authorNameById[m.user_id] =
      m.nickname || m.display_name || 'Toi & Moi';
  }

  const otherUserId =
    members?.find((m) => m.user_id !== user.id)?.user_id ?? null;

  return (
    <div className="min-h-screen">
      <MemoryDetailView
        memory={memory}
        photos={photos ?? []}
        coupleId={member.couple_id}
        currentUserId={user.id}
        otherUserId={otherUserId}
        initialMessages={messages}
        initialReads={initialReads}
        authorNameById={authorNameById}
      />
      <BottomNav active="memories" />
    </div>
  );
}
```

- [ ] **Step 3: Créer le loading**

Créer `app/memories/[id]/loading.tsx` :

```tsx
import { SurfacePanel } from '@/components/custom/page-shell';

export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <SurfacePanel className="space-y-4">
        <div className="skeleton-block h-8 w-2/3" />
        <div className="skeleton-block aspect-[4/3] w-full" />
        <div className="skeleton-block h-4 w-1/2" />
        <div className="skeleton-block h-20 w-full" />
      </SurfacePanel>
    </main>
  );
}
```

- [ ] **Step 4: Créer le composant client `MemoryDetailView`**

Créer `components/custom/memory-detail-view.tsx` :

```tsx
'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditMemoryDialog } from '@/components/custom/edit-memory-dialog';
import { Conversation } from '@/components/custom/conversation/conversation';
import { deleteMemory } from '@/app/memories/actions';
import { formatRelativeDate } from '@/lib/helpers';
import type { MessageRow } from '@/lib/conversations/types';

interface Photo {
  id: string;
  image_url: string;
}

interface Props {
  memory: {
    id: string;
    title: string;
    description: string | null;
    date: string;
  };
  photos: Photo[];
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>;
  authorNameById: Record<string, string>;
}

export function MemoryDetailView(props: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const form = new FormData();
    form.append('memoryId', props.memory.id);
    startTransition(async () => {
      try {
        await deleteMemory(form);
        toast.success('Souvenir supprimé.');
        router.push('/memories');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible de supprimer.'
        );
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col pb-36">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[#0b0d12]/80 px-4 py-3 backdrop-blur-lg">
        <Link
          href="/memories"
          aria-label="Retour"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-semibold text-foreground">Souvenir</h1>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
            aria-label="Menu"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditMemoryDialog
              memory={props.memory}
              photos={props.photos}
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" /> Modifier
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem
              onSelect={() => setConfirmDelete(true)}
              className="text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section className="px-4 py-4">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03]">
          <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto">
            {props.photos.length > 0 ? (
              props.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={props.memory.title}
                  className="aspect-[4/3] w-full shrink-0 snap-start object-cover"
                />
              ))
            ) : (
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-[#8fb2ff]/12 via-[#151922] to-[#465a93]/12" />
            )}
          </div>
          <div className="space-y-2 p-5">
            <h2 className="text-xl font-semibold text-foreground">
              {props.memory.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(props.memory.date)}
            </p>
            {props.memory.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {props.memory.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="px-4">
        <p className="section-kicker">Discussion</p>
      </div>

      <div className="flex-1 px-4 pb-4 pt-2">
        <Conversation
          coupleId={props.coupleId}
          currentUserId={props.currentUserId}
          otherUserId={props.otherUserId}
          contextType="memory"
          contextId={props.memory.id}
          initialMessages={props.initialMessages}
          initialReads={props.initialReads}
          authorNameById={props.authorNameById}
          placeholder="Écrire un commentaire…"
        />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-panel w-full max-w-sm space-y-4 rounded-[1.5rem] p-6 text-center">
            <p className="text-base font-semibold">Supprimer ce souvenir ?</p>
            <p className="text-sm text-muted-foreground">
              Les photos et la discussion seront aussi effacées.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="cta-secondary h-10 px-5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="cta-primary h-10 px-5"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Mettre à jour `EditMemoryDialog` pour accepter un `trigger` optionnel**

Inspecter `components/custom/edit-memory-dialog.tsx`. S'il expose déjà une prop `trigger`, passer. Sinon, ajouter une prop `trigger?: ReactNode` qui remplace le bouton interne quand fourni. Vérifier que l'API côté appels existants (`MemoryCard`) continue de fonctionner — la carte ne l'utilise plus puisqu'on a tout déplacé dans la page détail.

Run: `npx tsc --noEmit`
Si le compilateur rapporte une incompatibilité sur `EditMemoryDialog`, lire le fichier et ajouter le support de `trigger` (conserver le bouton par défaut si `trigger === undefined`).

- [ ] **Step 6: Vérifier les routes**

Run: `npm run dev`
- Naviguer sur `/memories` → tap sur une carte → vérifier arrivée sur `/memories/<id>` avec galerie, méta, et composer chat.
- Modifier le titre → vérifier apparition d'une ligne "a modifié ce souvenir" dans le fil, expandable.

- [ ] **Step 7: Commit**

```bash
git add app/memories/[id]/page.tsx app/memories/[id]/loading.tsx components/custom/memory-detail-view.tsx components/custom/memory-card.tsx
# plus components/custom/edit-memory-dialog.tsx si modifié
git commit -m "feat(memories): page détail avec galerie + fil de discussion"
```

---

## Task 16 : Refonte de `/questions` en chat continu + drawer thread

**Files:**
- Modify: `app/questions/page.tsx`
- Create: `components/custom/questions-chat.tsx`
- Create: `components/custom/thread-drawer.tsx`
- Delete: `components/custom/questions-carousel.tsx`

- [ ] **Step 1: Créer le drawer thread**

Créer `components/custom/thread-drawer.tsx` :

```tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Undo2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Conversation } from '@/components/custom/conversation/conversation';
import {
  markTopicDiscussed,
  unmarkTopicDiscussed,
} from '@/app/questions/topics-actions';
import { createClient } from '@/lib/supabase/client';
import type { MessageRow, ThreadTopicRow } from '@/lib/conversations/types';

interface ThreadDrawerProps {
  open: boolean;
  onClose: () => void;
  topic: ThreadTopicRow | null;
  questionText: string;
  setNumber: 1 | 2 | 3 | 4;
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  authorNameById: Record<string, string>;
}

const setLabel: Record<1 | 2 | 3 | 4, string> = { 1: 'I', 2: 'II', 3: 'III', 4: '+' };

export function ThreadDrawer({
  open,
  onClose,
  topic,
  questionText,
  setNumber,
  coupleId,
  currentUserId,
  otherUserId,
  authorNameById,
}: ThreadDrawerProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reads, setReads] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !topic) return;
    setLoaded(false);
    const supabase = createClient();
    (async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('context_type', 'thread')
        .eq('context_id', topic.id)
        .order('created_at', { ascending: true });
      const list = (msgs ?? []) as MessageRow[];
      setMessages(list);

      if (list.length > 0) {
        const { data: readsData } = await supabase
          .from('message_reads')
          .select('*')
          .in('message_id', list.map((m) => m.id));
        const map: Record<string, string[]> = {};
        for (const row of readsData ?? []) {
          const entry = row as { message_id: string; user_id: string };
          (map[entry.message_id] ??= []).push(entry.user_id);
        }
        setReads(map);
      } else {
        setReads({});
      }
      setLoaded(true);
    })();
  }, [open, topic, coupleId]);

  if (!topic) return null;

  const isDiscussed = topic.discussed_at !== null;

  function handleMark() {
    startTransition(async () => {
      try {
        await markTopicDiscussed(topic!.id);
        toast.success('Marquée discutée.', {
          action: {
            label: 'Annuler',
            onClick: () => {
              unmarkTopicDiscussed(topic!.id).catch(() => undefined);
            },
          },
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Échec.');
      }
    });
  }

  function handleUnmark() {
    startTransition(async () => {
      await unmarkTopicDiscussed(topic!.id);
      toast.success('Discussion rouverte.');
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0b0d12]"
        >
          <header className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="accent-chip">{setLabel[setNumber]}</span>
            <div className="w-10" />
          </header>

          <div className="px-5 pb-2">
            <p className="text-base font-semibold leading-snug text-foreground">
              {questionText}
            </p>
          </div>

          <div className="flex-1 min-h-0 px-4 pb-4">
            {loaded && (
              <Conversation
                coupleId={coupleId}
                currentUserId={currentUserId}
                otherUserId={otherUserId}
                contextType="thread"
                contextId={topic.id}
                initialMessages={messages}
                initialReads={reads}
                authorNameById={authorNameById}
                placeholder="Écrire…"
              />
            )}
          </div>

          <div className="px-4 pb-4">
            {isDiscussed ? (
              <button
                type="button"
                onClick={handleUnmark}
                disabled={isPending}
                className="cta-secondary h-11 w-full"
              >
                <Undo2 className="h-4 w-4" /> Rouvrir la discussion
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMark}
                disabled={isPending}
                className="cta-primary h-11 w-full"
              >
                <Check className="h-4 w-4" /> Marquer comme discutée
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Créer le composant client principal de la page**

Créer `components/custom/questions-chat.tsx` :

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Conversation } from '@/components/custom/conversation/conversation';
import { PickQuestionDialog } from '@/components/custom/pick-question-dialog';
import { ThreadDrawer } from '@/components/custom/thread-drawer';
import { QUESTIONS } from '@/lib/questions';
import type {
  MessageRow,
  ThreadTopicRow,
} from '@/lib/conversations/types';

interface CustomQuestion {
  id: string;
  text: string;
}

interface Props {
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  authorNameById: Record<string, string>;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>;
  topics: ThreadTopicRow[];
  customQuestions: CustomQuestion[];
}

export function QuestionsChat(props: Props) {
  const [activeTopic, setActiveTopic] = useState<ThreadTopicRow | null>(null);

  const topicMap = useMemo(() => {
    const map = new Map<string, ThreadTopicRow>();
    for (const topic of props.topics) map.set(topic.id, topic);
    return map;
  }, [props.topics]);

  const pushedBuiltinIndices = props.topics
    .filter((t) => t.question_index !== null)
    .map((t) => t.question_index!) as number[];
  const pushedCustomIds = props.topics
    .filter((t) => t.custom_question_id !== null)
    .map((t) => t.custom_question_id!);

  const openTopicThread = useCallback(
    (topicId: string) => {
      const topic = topicMap.get(topicId);
      if (topic) setActiveTopic(topic);
    },
    [topicMap]
  );

  const activeQuestionText = activeTopic
    ? activeTopic.question_index !== null
      ? QUESTIONS.find((q) => q.index === activeTopic.question_index)?.text ?? '...'
      : props.customQuestions.find((q) => q.id === activeTopic.custom_question_id)?.text ?? '...'
    : '';
  const activeSetNumber: 1 | 2 | 3 | 4 = activeTopic
    ? activeTopic.question_index !== null
      ? (QUESTIONS.find((q) => q.index === activeTopic.question_index)?.set ?? 1)
      : 4
    : 1;

  const topicDiscussedCount = props.topics.filter((t) => t.discussed_at).length;
  const totalQuestions = QUESTIONS.length + props.customQuestions.length;

  return (
    <div className="mx-auto flex h-[calc(100svh-6rem)] w-full max-w-2xl flex-col px-4 pb-4">
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="section-kicker">Rituel</p>
          <p className="mt-1 text-sm text-foreground">
            {topicDiscussedCount} / {totalQuestions} questions discutées
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Conversation
          coupleId={props.coupleId}
          currentUserId={props.currentUserId}
          otherUserId={props.otherUserId}
          contextType="main"
          contextId={null}
          initialMessages={props.initialMessages}
          initialReads={props.initialReads}
          authorNameById={props.authorNameById}
          placeholder="Écrire à votre partenaire…"
          onOpenTopicThread={openTopicThread}
          composerSlot={
            <PickQuestionDialog
              customQuestions={props.customQuestions}
              pushedBuiltinIndices={pushedBuiltinIndices}
              pushedCustomIds={pushedCustomIds}
              trigger={
                <button
                  type="button"
                  aria-label="Piocher une question"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-foreground"
                >
                  <Plus className="h-5 w-5" />
                </button>
              }
            />
          }
        />
      </div>

      <ThreadDrawer
        open={activeTopic !== null}
        onClose={() => setActiveTopic(null)}
        topic={activeTopic}
        questionText={activeQuestionText}
        setNumber={activeSetNumber}
        coupleId={props.coupleId}
        currentUserId={props.currentUserId}
        otherUserId={props.otherUserId}
        authorNameById={props.authorNameById}
      />
    </div>
  );
}
```

- [ ] **Step 3: Réécrire `app/questions/page.tsx`**

Lire le fichier actuel pour comprendre les requêtes existantes, puis remplacer par :

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/custom/bottom-nav';
import { QuestionsChat } from '@/components/custom/questions-chat';
import { backfillTopicsFromProgress } from '@/app/questions/topics-actions';
import type { MessageRow, ThreadTopicRow } from '@/lib/conversations/types';

export default async function QuestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();
  if (!member) redirect('/setup');

  await backfillTopicsFromProgress();

  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('couple_id', member.couple_id)
    .eq('context_type', 'main')
    .order('created_at', { ascending: true });
  const messages = (messagesData ?? []) as MessageRow[];

  const messageIds = messages.map((m) => m.id);
  const { data: readsData } = messageIds.length
    ? await supabase.from('message_reads').select('*').in('message_id', messageIds)
    : { data: [] };
  const initialReads: Record<string, string[]> = {};
  for (const row of readsData ?? []) {
    const entry = row as { message_id: string; user_id: string };
    (initialReads[entry.message_id] ??= []).push(entry.user_id);
  }

  const { data: topics } = await supabase
    .from('thread_topics')
    .select('*')
    .eq('couple_id', member.couple_id);

  const { data: customQuestions } = await supabase
    .from('custom_questions')
    .select('id, text')
    .eq('couple_id', member.couple_id);

  const { data: members } = await supabase
    .from('couple_members')
    .select('user_id, display_name, nickname')
    .eq('couple_id', member.couple_id);

  const authorNameById: Record<string, string> = {};
  for (const m of members ?? []) {
    authorNameById[m.user_id] = m.nickname || m.display_name || 'Toi & Moi';
  }

  const otherUserId = members?.find((m) => m.user_id !== user.id)?.user_id ?? null;

  return (
    <div className="min-h-screen">
      <QuestionsChat
        coupleId={member.couple_id}
        currentUserId={user.id}
        otherUserId={otherUserId}
        authorNameById={authorNameById}
        initialMessages={messages}
        initialReads={initialReads}
        topics={(topics ?? []) as ThreadTopicRow[]}
        customQuestions={customQuestions ?? []}
      />
      <BottomNav active="questions" />
    </div>
  );
}
```

- [ ] **Step 4: Supprimer l'ancien carousel**

Run:
```bash
git rm components/custom/questions-carousel.tsx
```

Vérifier qu'aucun autre fichier ne l'importait (grep `questions-carousel`). Si oui, retirer l'import.

- [ ] **Step 5: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 6: Test manuel**

Run: `npm run dev`
- Ouvrir `/questions` sur deux comptes différents (navigateur privé pour le second).
- Depuis un compte, appuyer sur "+" → choisir une question → la carte-topic doit apparaître dans le fil des deux côtés en temps réel.
- Tap sur "Ouvrir la discussion" → drawer slide-up → envoyer un message → l'autre côté le voit.
- Marquer "Discutée" → l'autre côté voit la ligne "marquée discutée" et le compteur passe à X/Y.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(questions): chat rituel asynchrone + drawer thread"
```

---

## Task 17 : Mettre à jour la page `/memories` (retrait des actions de carte)

**Files:**
- Modify: `app/memories/page.tsx`

*(Déjà couvert par Task 15 — la `MemoryCard` est maintenant un `<Link>`. Ce task confirme que la page liste fonctionne toujours.)*

- [ ] **Step 1: Lancer le dev**

Run: `npm run dev`
- Aller sur `/memories`.
- Cliquer sur une carte → `/memories/[id]`.
- Le bouton "Ajouter un souvenir" en haut continue de fonctionner.

- [ ] **Step 2: Pas de changement de code nécessaire — passer à Task 18**

---

## Task 18 : Vérification complète et corrections finales

**Files:** —

- [ ] **Step 1: Lancer tous les contrôles**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
Expected: tous passent. Si échec, corriger avant commit.

- [ ] **Step 2: Test manuel end-to-end**

Run: `npm run dev`
Scénarios :
1. Se connecter avec deux comptes (couple) sur deux navigateurs.
2. **Souvenirs** : créer un souvenir → ouvrir le détail → commenter depuis les deux comptes → modifier le titre depuis un compte → vérifier que l'événement de modification s'affiche dans le fil avec diff expandable. Supprimer → redirection + disparition.
3. **Rituel** : pousser une question → carte-topic dans le fil → ouvrir le thread → échanger des messages → marquer "Discutée" → vérifier ligne système + compteur + bouton "Rouvrir".
4. **Accusés / typing** : vérifier l'apparition de l'indicateur "écrit…" et des "Lu" / "Envoyé" sous les bulles.
5. **Scrollbars** : naviguer sur chaque page (`/dashboard`, `/memories`, `/memories/[id]`, `/questions`, `/album`, `/calendar`, `/rules`) et confirmer qu'aucune scrollbar n'apparaît (Windows, Chrome/Firefox/Safari). Scroll fonctionne partout.
6. **Compat** : vérifier qu'un couple existant (avec des `questions_progress` avant migration) voit bien ses questions déjà discutées reflétées comme "déjà poussée" dans la modale et dans le compteur.

- [ ] **Step 3: Commit final (si des ajustements ont été nécessaires)**

S'il y a eu des fixes :
```bash
git add -A
git commit -m "fix: corrections after end-to-end validation"
```

---

## Self-review du plan (checklist exécutée par l'auteur)

**Couverture du spec** :
- Table `messages` → Task 2
- Table `message_reads` → Task 2
- Table `thread_topics` → Task 2
- `memories.updated_at` → Task 2
- Triggers cleanup → Task 2
- `create_system_message` RPC → Task 2
- RLS durcies (pas d'insert system côté client) → Task 2
- Types TS → Task 3
- Diff utilitaire + tests → Task 4
- Server actions messages → Task 5
- Server actions topics (push / mark / unmark / backfill) → Task 6
- `updateMemory` avec diff + système → Task 7
- Scrollbars cachées → Task 8
- `<MessageBubble>` → Task 9
- `<SystemEvent>` → Task 10
- `<TypingIndicator>` → Task 10 bis
- `<Composer>` → Task 11
- Realtime provider + hook → Task 12
- `<Conversation>` + `<MessageList>` → Task 13
- `<PickQuestionDialog>` → Task 14
- Page détail souvenir + `MemoryDetailView` → Task 15
- Refonte `/questions` + `ThreadDrawer` → Task 16
- Migration données `questions_progress` → implicite via `backfillTopicsFromProgress` (appelée dans Task 16 Step 3)
- Vérification finale → Task 18

**Placeholders** : aucun `TBD`, `TODO`, `add error handling` trouvé. Les steps concernant des fichiers existants (Task 15 Step 5 pour `EditMemoryDialog`) donnent la règle et laissent l'ingénieur inspecter le fichier — acceptable car c'est un petit ajout de prop optionnelle.

**Cohérence de types** : `MessageRow`, `ThreadTopicRow`, `OptimisticMessage`, `MemoryDiff` définis en Task 3 et utilisés partout. Signatures des actions (`postMessage`, `pushTopic`, `markTopicDiscussed`, `unmarkTopicDiscussed`) stables entre Tasks 5, 6 et les composants consommateurs.

Aucune incohérence détectée.
