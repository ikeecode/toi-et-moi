# Conversations unifiées + finitions mobile — design

Date : 2026-04-19
Statut : design validé en brainstorming, en attente revue utilisateur

## Objectif

Transformer Toi & Moi en une expérience app mobile plus intime et asynchrone autour de trois ajouts :

1. **Page détail d'un souvenir** avec fil de discussion (commentaires + événements système pour les modifications, combo C+D).
2. **Rituel asynchrone** : la page `/questions` devient un chat continu où les questions sont poussées manuellement comme cartes-topics avec threads (variante C du brainstorming).
3. **Disparition des barres de défilement** pour une sensation d'app native.

Les trois fonctionnalités partagent une surface conversationnelle unique (tables, composants, canal temps réel), ce qui garantit une cohérence visuelle et un coût d'évolution minimal.

## Contexte existant

- Next.js 16 (voir `AGENTS.md` : APIs non standards, consulter les docs locales avant de coder).
- Supabase (DB + Auth + Realtime + Storage). Canal Realtime déjà utilisé pour la présence/broadcast dans `QuestionsCarousel`.
- RLS activée partout ; helper `public.get_my_couple_id()` en `security definer`.
- Design system en place : `surface-panel`, `soft-chip`, `cta-primary`, `page-shell`, `AppPage`, `PageHero`.
- `framer-motion` et `sonner` (toasts) déjà présents ; pas de nouvelle dépendance requise.
- Carousel actuel : `components/custom/questions-carousel.tsx`. Progression actuelle dans la table `questions_progress`.

## Décisions clés (issues du brainstorming)

| # | Décision |
|---|----------|
| 1 | Les souvenirs restent modifiables **et** supprimables, mais chaque modification laisse une trace visible (C+D). |
| 2 | Le fil du souvenir est un chat hybride : bulles iMessage pour les messages, lignes système centrées pour les événements (modif, création). |
| 3 | La page rituel devient un fil principal continu avec cartes-topics cliquables ouvrant des threads (C). |
| 4 | Les questions sont poussées **manuellement** dans le fil par un partenaire, via une modale "Piocher une question" (A). |
| 5 | Carousel actuel **supprimé**, remplacé par la modale de picking (5a=C). |
| 6 | Thread reste éditable après "Discutée" (5b=A). |
| 7 | Scrollbars invisibles partout, scroll toujours fonctionnel (5c). |
| 8 | Indicateurs "en train d'écrire" **et** accusés de lecture (5d=A). |
| 9 | Architecture données : table unifiée `messages` polymorphe (Approche 2). |
| 10 | `questions_progress` conservée pour compat ; la source de vérité bascule sur `thread_topics.discussed_at`. |

## Modèle de données

Toutes les tables héritent du pattern RLS `couple_id = public.get_my_couple_id()`.

### Table `messages` (nouvelle)

Surface unifiée pour commentaires de souvenirs, messages du fil principal, messages de thread et événements système.

```sql
create table public.messages (
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
  constraint messages_system_needs_metadata check (
    kind <> 'system' or metadata ? 'event'
  )
);

create index messages_context_idx
  on public.messages (couple_id, context_type, context_id, created_at desc);
```

### Table `message_reads` (nouvelle)

```sql
create table public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  read_at    timestamptz not null default now(),
  primary key (message_id, user_id)
);
```

### Table `thread_topics` (nouvelle)

```sql
create table public.thread_topics (
  id                   uuid primary key default uuid_generate_v4(),
  couple_id            uuid not null references public.couples(id) on delete cascade,
  question_index       integer,
  custom_question_id   uuid references public.custom_questions(id) on delete cascade,
  pushed_by            uuid not null references auth.users(id),
  pushed_at            timestamptz not null default now(),
  discussed_at         timestamptz,
  discussed_by         uuid references auth.users(id),
  constraint thread_topics_one_source check (
    (question_index is not null and custom_question_id is null) or
    (question_index is null and custom_question_id is not null)
  )
);

create unique index thread_topics_builtin_unique
  on public.thread_topics (couple_id, question_index)
  where question_index is not null;

create unique index thread_topics_custom_unique
  on public.thread_topics (couple_id, custom_question_id)
  where custom_question_id is not null;
```

### Modification `memories`

```sql
alter table public.memories
  add column updated_at timestamptz not null default now();
```

### RLS

```sql
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.thread_topics enable row level security;

-- messages
create policy "Members can view messages" on public.messages
  for select using (couple_id = public.get_my_couple_id());

-- Clients can only insert their own text messages.
-- System messages sont insérés via la fonction SQL security-definer `create_system_message(...)`.
create policy "Members can insert text messages" on public.messages
  for insert with check (
    couple_id = public.get_my_couple_id()
    and kind = 'text'
    and author_id = auth.uid()
  );

create policy "Authors can edit their messages" on public.messages
  for update using (author_id = auth.uid() and kind = 'text');

create policy "Authors can delete their messages" on public.messages
  for delete using (author_id = auth.uid() and kind = 'text');

-- message_reads
create policy "Members can view reads for their couple" on public.message_reads
  for select using (
    message_id in (select id from public.messages where couple_id = public.get_my_couple_id())
  );

create policy "Users track their own reads" on public.message_reads
  for insert with check (user_id = auth.uid());

-- thread_topics
create policy "Members can view topics" on public.thread_topics
  for select using (couple_id = public.get_my_couple_id());

create policy "Members can push topics" on public.thread_topics
  for insert with check (couple_id = public.get_my_couple_id() and pushed_by = auth.uid());

create policy "Members can mark discussed" on public.thread_topics
  for update using (couple_id = public.get_my_couple_id());
```

### Migration rétroactive

Au premier accès authentifié post-déploiement, une action serveur idempotente crée un `thread_topic` pour chaque ligne existante dans `questions_progress` du couple courant (avec `discussed_at = questions_progress.completed_at` et `discussed_by = completed_by`). Cette migration tourne dans un `INSERT ... ON CONFLICT DO NOTHING` pour rester sûre.

## Fonctionnalité 1 — Détail d'un souvenir

### Route et navigation

- Nouvelle page serveur : `app/memories/[id]/page.tsx`.
- `MemoryCard` devient un `<Link href="/memories/{id}">`. Les boutons au-hover (Éditer, Supprimer) sont retirés de la carte ; tout passe par la page détail.
- Loading state : `app/memories/[id]/loading.tsx` réutilise les skeletons existants.

### Structure de la page

1. **Header** (sticky) : bouton retour (flèche), titre "Souvenir", menu kebab (ouvre dropdown Modifier / Supprimer).
2. **Galerie hero** : carrousel horizontal des photos, snap points, pagination par dots. Première photo plein-largeur, ratio 4/3.
3. **Bloc métadonnées** : titre, date relative, description, auteur. Une seule `surface-panel`.
4. **Séparateur "Discussion"** : composant `section-kicker`.
5. **Conversation** : `<Conversation contextType="memory" contextId={memory.id} />` avec composer sticky en bas (au-dessus du `BottomNav`).

### Modification et audit

- `EditMemoryDialog` existant réutilisé tel quel, ouvert depuis le menu kebab.
- Action `updateMemory` (dans `app/memories/actions.ts`) enrichie :
  - Lit l'état courant avant update.
  - Applique l'update SQL, met à jour `updated_at`.
  - Construit un diff `{ title?: {from,to}, description?: {from,to}, date?: {from,to}, photos_added?: n, photos_removed?: n }`.
  - Insère un `message` avec `kind='system'`, `context_type='memory'`, `context_id=memory.id`, `metadata={event:'memory.edited', diff}`.
- Création d'un souvenir → insère un `message` `metadata={event:'memory.created'}` (ligne de démarrage du fil).

### Suppression

- Déplacée dans le menu kebab. Confirmation modale via `Dialog` existant.
- Nettoyage des messages associés : `messages.context_id` est polymorphe (pas une FK), donc un cascade SQL n'est pas possible directement. On ajoute un trigger `before delete on memories` qui supprime `messages where context_type='memory' and context_id = OLD.id`. Même logique pour `thread_topics` quand un `custom_question` est supprimé.

## Fonctionnalité 2 — Rituel asynchrone

### Page `/questions`

Remplace `QuestionsCarousel`. Conserve `BottomNav` et `AppPage`.

- **Timeline principale** : `<Conversation contextType="main" contextId={null} />` qui rend messages texte **et** cartes-topics.
- Une carte-topic est un `message` avec `kind='system'`, `metadata={event:'topic.pushed', topicId, questionRef, setNumber, questionText}`. Elle est rendue par le `SystemEvent` spécialisé comme une carte cliquable, pas une ligne discrète.
- **Composer** : textarea auto-grow + bouton **"+"** (ouvre `PickQuestionDialog`) + bouton envoyer.

### Modale "Piocher une question"

- Composant `<PickQuestionDialog>` basé sur `Dialog`.
- Onglets I / II / III / + (style identique aux chips actuelles).
- Liste filtrable (input de recherche texte) des questions des sets 1-3 et des `custom_questions` du couple.
- Les questions déjà "abordées" (= il existe un `thread_topic` pour ce couple) apparaissent grisées avec chip "Déjà poussée".
- Sélection d'une question :
  1. Insert `thread_topics` (ou récupère existant).
  2. Insert un `message` `kind='system'` `metadata={event:'topic.pushed', topicId, ...}` dans `context_type='main'`.
  3. Ferme la modale, scrolle le fil en bas.

### Drawer de thread

- Tap sur la carte-topic dans le fil principal ouvre un drawer plein-écran (slide-up framer-motion, dur 320ms `easeOut`).
- Header : bouton fermer (X), chip set, titre question.
- Corps : `<Conversation contextType="thread" contextId={topicId} />`.
- Footer : bouton **"Marquer Discutée"** (disponible pour les deux partenaires, à tout moment). Si déjà discuté, affiche un chip "Discutée le Jj Mmm par Prénom" + bouton "Annuler" (visible 10 s, toast-undo pattern).
- Après marquage : insert `message` `kind='system'` `metadata={event:'topic.discussed', by:userId}` dans **les deux contextes** (thread + main) pour que le fil principal reflète aussi l'état.

### Compteur de progression

- Le compteur `X / Y discutées` reste visible en header de `/questions`.
- Y = nombre total de questions (builtin + custom).
- X = nombre de `thread_topics` du couple avec `discussed_at is not null`.
- `questions_progress` n'est plus lue ; elle est seulement écrite en double pour compat (voir migration).

## Fonctionnalité 3 — Scrollbars cachées

Ajouter dans `app/globals.css`, dans le bloc `@layer utilities` :

```css
html, body {
  scrollbar-width: none;
}
* {
  -ms-overflow-style: none;
}
*::-webkit-scrollbar {
  display: none;
}
```

Aucun élément n'a besoin d'exclusion — le scroll horizontal/vertical reste pleinement fonctionnel via molette, trackpad et touch. Vérification manuelle sur : album (grid), galerie photo, threads longs, carousel horizontal du détail souvenir.

## Composant `<Conversation>` partagé

Arborescence proposée : `components/custom/conversation/`

- `conversation.tsx` — orchestrateur client. Reçoit `contextType`, `contextId`, `initialMessages` (SSR). Ouvre la subscription Realtime ciblée, gère l'état optimistic, expose les callbacks d'envoi.
- `message-list.tsx` — rend les bulles + événements. Auto-scroll en bas à l'insert local. Virtualisation (via `react-window` si dépendance acceptée ; sinon rendu direct capé à 200 derniers, pagination "charger plus" au scroll haut).
- `message-bubble.tsx` — gauche/droite selon `author_id === currentUserId`. Coin arrondi adaptatif pour groupes consécutifs du même auteur (style iMessage). Affiche l'heure en tap, pas par défaut.
- `system-event.tsx` — rend selon `metadata.event` :
  - `memory.created` : ligne discrète "Souvenir créé".
  - `memory.edited` : ligne expandable qui révèle le diff avant/après.
  - `topic.pushed` (dans le fil principal) : **carte** avec set/question/boutons.
  - `topic.discussed` : ligne discrète "Discutée par X".
- `composer.tsx` — textarea auto-grow, shortcut Entrée (shift+Entrée = saut de ligne), slot optionnel `<ComposerSlot>` pour le bouton "+" de la modale questions.
- `typing-indicator.tsx` — trois points animés, affiché quand broadcast `typing` reçu pour le contexte courant.
- `read-receipt.tsx` — petit check sous la dernière bulle sortante ; gris = envoyé, bleu accent = lu.
- `pick-question-dialog.tsx` — modale de picking (réutilise `Dialog` de `components/ui`).

## Stratégie temps réel

- **Un seul canal par couple** : `couple:<couple_id>`, abonné dès la session authentifiée (composant client monté dans le layout authentifié).
- Events reçus :
  - `postgres_changes` sur `messages` (insert/update/delete) → router par `context_type` + `context_id` au bon `<Conversation>` monté.
  - `postgres_changes` sur `thread_topics` → mise à jour des cartes-topics.
  - `broadcast` `typing` → `{contextType, contextId, userId}`, TTL 2 s.
  - `broadcast` `navigate` existant (rituel) : supprimé, plus utilisé.
- **Optimistic updates** : à l'envoi, le message apparaît immédiatement avec `status='sending'`, puis `sent` après retour de l'insert, puis `read` via `message_reads` broadcast.
- **Accusés de lecture** : à l'affichage d'un message non-lu dont l'auteur ≠ utilisateur courant, insert dans `message_reads`. Les lectures sont broadcast aux autres clients via `postgres_changes`.

## Actions serveur (resumé)

Nouvelles actions dans `app/memories/actions.ts` et nouveau `app/questions/actions.ts` (refonte) :

- `postMessage({ contextType, contextId, body })` → insert `messages` `kind='text'`.
- `editMessage(messageId, newBody)` → update `body`, `edited_at`.
- `deleteMessage(messageId)` → delete (RLS : auteur only).
- `markMessageRead(messageId)` → upsert `message_reads`.
- `pushTopic({ questionIndex? , customQuestionId? })` → insert `thread_topics` + `message` système.
- `markTopicDiscussed(topicId)` / `unmarkTopicDiscussed(topicId)` → update + message système dans les deux contextes + ligne miroir dans `questions_progress` pour compat.
- `updateMemory(...)` existant étendu → calcule le diff et insère le message système.

## Tests

- **Unitaires** (actions) : `postMessage` vérifie RLS, `pushTopic` vérifie unicité, `markTopicDiscussed` vérifie double insert système + mise à jour `questions_progress`, `updateMemory` vérifie la génération du diff.
- **Composants** (RTL) : `<Conversation>` avec fixtures de messages mixtes (text + system), affichage optimistic, insertion realtime simulée, typing indicator.
- **E2E léger** (Playwright si dispo, sinon manuel documenté) : parcours (1) pousser une question puis discuter dans le thread, (2) modifier un souvenir puis voir l'événement dans le fil, (3) vérifier absence de scrollbar sur desktop + mobile.
- **RLS** : script SQL de test qui simule deux utilisateurs de couples différents et vérifie qu'aucun ne peut lire les messages de l'autre.

## Plan de migration et déploiement

1. Migration SQL : créer `messages`, `message_reads`, `thread_topics`, ajouter `updated_at` à `memories`, trigger de cleanup, politiques RLS.
2. Déployer le code côté app : nouvelles actions serveur + composant `<Conversation>` + page détail souvenir + refonte `/questions`.
3. Migration des `questions_progress` existants en `thread_topics` (idempotent, au premier accès).
4. Monitoring sur 48 h : nombre de messages, erreurs RLS, latence Realtime.
5. `questions_progress` reste en place ; une migration ultérieure pourra la drop quand la compat n'est plus requise.

## Hors scope (YAGNI)

- Réactions emoji sur messages (reported pour plus tard).
- Épingler un message dans le fil.
- Messages audio / vidéo.
- Recherche full-text dans les conversations.
- Threads imbriqués (`reply_to` est créé mais non exposé en UI pour l'instant).
- Notifications push (géré séparément via le service worker existant, à brancher dans un second temps).

## Risques identifiés

| Risque | Mitigation |
|---|---|
| La table `messages` devient un hotspot (tous les envois passent dedans) | Index sur `(couple_id, context_type, context_id, created_at desc)` ; pagination par 50. |
| Perte de `questions_progress` au déploiement | Migration idempotente côté accès, écriture double lors du marquage. |
| Messages orphelins après suppression d'un souvenir | Trigger `before delete on memories` supprime les messages liés. |
| Confusion UX : le même bouton "Marquer Discutée" existe à deux endroits (thread + carte-topic) | Un seul bouton, dans le drawer thread. La carte-topic affiche seulement le statut. |
| Abonnement Realtime unique au layout surcharge le router client | Subscription montée dans un contexte React partagé, démonté au logout. |
| RLS : un client malveillant pourrait insérer un `message` `kind='system'` avec un `metadata.event` falsifié (puisque la politique INSERT l'autorise aux membres du couple) | Les actions serveur qui créent des messages système utilisent un helper SQL `create_system_message(...)` en `security definer` qui impose les champs valides ; la politique INSERT est durcie pour ne plus accepter `kind='system'` côté client, uniquement `kind='text' and author_id = auth.uid()`. |
