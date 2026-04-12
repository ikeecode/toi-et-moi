'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function getCurrentCouple() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    throw new Error('No couple found');
  }

  return { supabase, user, coupleId: coupleMember.couple_id as string };
}

export async function proposeRule(formData: FormData) {
  const text = (formData.get('text') as string)?.trim();
  if (!text || text.length < 3 || text.length > 500) {
    throw new Error('La règle doit contenir entre 3 et 500 caractères.');
  }

  const { supabase, user, coupleId } = await getCurrentCouple();

  const { error } = await supabase.from('rules').insert({
    couple_id: coupleId,
    text,
    proposed_by: user.id,
  });

  if (error) {
    throw new Error("Impossible de proposer la règle.");
  }

  revalidatePath('/rules');
}

export async function approveRule(ruleId: string) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  // Verify the rule exists, belongs to the couple, and was NOT proposed by this user
  const { data: rule } = await supabase
    .from('rules')
    .select('id, proposed_by, status')
    .eq('id', ruleId)
    .eq('couple_id', coupleId)
    .single();

  if (!rule) {
    throw new Error('Règle introuvable.');
  }

  if (rule.proposed_by === user.id) {
    throw new Error('Vous ne pouvez pas approuver votre propre règle.');
  }

  if (rule.status !== 'pending') {
    throw new Error('Cette règle a déjà été traitée.');
  }

  const { error } = await supabase
    .from('rules')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', ruleId);

  if (error) {
    throw new Error("Impossible d'approuver la règle.");
  }

  revalidatePath('/rules');
}

export async function rejectRule(ruleId: string) {
  const { supabase, user, coupleId } = await getCurrentCouple();

  const { data: rule } = await supabase
    .from('rules')
    .select('id, proposed_by, status')
    .eq('id', ruleId)
    .eq('couple_id', coupleId)
    .single();

  if (!rule) {
    throw new Error('Règle introuvable.');
  }

  if (rule.proposed_by === user.id) {
    throw new Error('Vous ne pouvez pas rejeter votre propre règle.');
  }

  if (rule.status !== 'pending') {
    throw new Error('Cette règle a déjà été traitée.');
  }

  const { error } = await supabase
    .from('rules')
    .update({
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', ruleId);

  if (error) {
    throw new Error('Impossible de rejeter la règle.');
  }

  revalidatePath('/rules');
}

export async function deleteRule(ruleId: string) {
  const { supabase, coupleId } = await getCurrentCouple();

  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', ruleId)
    .eq('couple_id', coupleId);

  if (error) {
    throw new Error('Impossible de supprimer la règle.');
  }

  revalidatePath('/rules');
}
