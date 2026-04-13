'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Vous devez être connecté pour ajouter une date.');

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('Aucun espace couple trouvé.');

  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const type = formData.get('type') as string;

  if (!title || !date || !type) {
    throw new Error('Le titre, la date et le type sont requis.');
  }

  const { error } = await supabase.from('events').insert({
    couple_id: coupleMember.couple_id,
    title,
    date,
    type,
    created_by: user.id,
  });

  if (error) throw new Error("Impossible d'ajouter cet événement.");

  revalidatePath('/calendar');
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Vous devez être connecté pour supprimer une date.');

  const eventId = formData.get('eventId') as string;
  if (!eventId) throw new Error("L'identifiant de l'événement est requis.");

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('Aucun espace couple trouvé.');

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('couple_id', coupleMember.couple_id);

  if (error) throw new Error("Impossible de supprimer cet événement.");

  revalidatePath('/calendar');
}
