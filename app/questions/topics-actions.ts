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

  await insertSystemMessage(supabase, {
    coupleId,
    contextType: 'main',
    contextId: null,
    event: 'topic.discussed',
    metadata: { topicId, by: user.id },
    authorId: user.id,
  });

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
    contextType: 'main',
    contextId: null,
    event: 'topic.undiscussed',
    metadata: { topicId, by: user.id },
    authorId: user.id,
  });

  revalidatePath('/questions');
}

export async function autoDiscussTopics() {
  const { supabase, coupleId } = await getCurrentCouple();

  const { data: topics } = await supabase
    .from('thread_topics')
    .select('id, pushed_at, discussed_at')
    .eq('couple_id', coupleId)
    .is('discussed_at', null)
    .order('pushed_at', { ascending: true });

  if (!topics || topics.length === 0) return;

  for (const topic of topics) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('author_id')
      .eq('couple_id', coupleId)
      .eq('context_type', 'main')
      .eq('kind', 'text')
      .gt('created_at', topic.pushed_at);

    const distinctAuthors = new Set(
      (msgs ?? [])
        .map((m) => (m as { author_id: string | null }).author_id)
        .filter((id): id is string => Boolean(id))
    );

    if (distinctAuthors.size >= 2) {
      const [firstAuthor] = distinctAuthors;
      const { data: updated } = await supabase
        .from('thread_topics')
        .update({
          discussed_at: new Date().toISOString(),
          discussed_by: firstAuthor,
        })
        .eq('id', topic.id)
        .is('discussed_at', null)
        .select()
        .single();

      if (updated) {
        const { error: progressError } = await supabase
          .from('questions_progress')
          .insert({
            couple_id: coupleId,
            question_index: updated.question_index,
            custom_question_id: updated.custom_question_id,
            completed_by: firstAuthor,
          });
        if (progressError && progressError.code !== '23505') {
          console.error('autoDiscussTopics progress insert error', progressError);
        }

        await insertSystemMessage(supabase, {
          coupleId,
          contextType: 'main',
          contextId: null,
          event: 'topic.discussed',
          metadata: { topicId: topic.id, auto: true },
          authorId: firstAuthor,
        });
      }
    }
  }
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
