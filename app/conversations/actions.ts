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
