'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function getCurrentCouple() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Vous devez être connecté.');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    throw new Error('Aucun espace couple trouvé.');
  }

  return { supabase, user, coupleId: coupleMember.couple_id as string };
}

export async function markBuiltinQuestionCompleted(questionIndex: number) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const { error } = await supabase.from('questions_progress').insert({
    couple_id: coupleId,
    question_index: questionIndex,
    completed_by: user.id,
  });

  if (error && error.code !== '23505') {
    throw new Error("Impossible d'enregistrer cette question.");
  }

  revalidatePath('/questions');
}

export async function markCustomQuestionCompleted(customQuestionId: string) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const { error } = await supabase.from('questions_progress').insert({
    couple_id: coupleId,
    custom_question_id: customQuestionId,
    completed_by: user.id,
  });

  if (error && error.code !== '23505') {
    throw new Error("Impossible d'enregistrer cette question.");
  }

  revalidatePath('/questions');
}

export async function addCustomQuestion(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 500) {
    throw new Error('La question doit contenir entre 3 et 500 caractères.');
  }

  const { supabase, user, coupleId } = await getCurrentCouple();

  const { data, error } = await supabase
    .from('custom_questions')
    .insert({
      couple_id: coupleId,
      text: trimmed,
      created_by: user.id,
    })
    .select('id, text, created_by, created_at')
    .single();

  if (error || !data) {
    throw new Error('Impossible d’ajouter la question.');
  }

  revalidatePath('/questions');
  return data;
}

export async function deleteCustomQuestion(id: string) {
  const { supabase, coupleId } = await getCurrentCouple();

  const { error } = await supabase
    .from('custom_questions')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId);

  if (error) {
    throw new Error('Impossible de supprimer la question.');
  }

  revalidatePath('/questions');
}
