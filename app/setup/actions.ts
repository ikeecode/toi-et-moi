'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createCoupleSpace(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login?error=Vous devez être connecté pour créer un espace couple.');
  }

  const coupleName = (formData.get('couple_name') as string) || null;
  const anniversary = formData.get('anniversary') as string;

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({
      name: coupleName,
      anniversary_date: anniversary,
    })
    .select('id')
    .single();

  if (coupleError || !couple) {
    redirect(
      `/setup?error=${encodeURIComponent(coupleError?.message ?? "Impossible de créer l'espace couple.")}`
    );
  }

  const displayName =
    user.user_metadata?.display_name || user.email?.split('@')[0] || 'Vous';

  const { error: memberError } = await supabase.from('couple_members').insert({
    couple_id: couple.id,
    user_id: user.id,
    role: 'owner',
    display_name: displayName,
  });

  if (memberError) {
    redirect(
      `/setup?error=${encodeURIComponent(memberError.message)}`
    );
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
