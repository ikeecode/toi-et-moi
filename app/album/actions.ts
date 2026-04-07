'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadAlbumPhotos(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('No couple found');

  const images = formData.getAll('images') as File[];

  for (const image of images) {
    if (!image || !image.size || image.size === 0) continue;

    const fileExt = image.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `album/${coupleMember.couple_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filePath, image);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      continue;
    }
  }

  revalidatePath('/album');
}

export async function deleteAlbumPhoto(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('No couple found');

  const filePath = formData.get('filePath') as string;
  if (!filePath) throw new Error('File path is required');

  // Ensure the file belongs to the couple's album
  const expectedPrefix = `album/${coupleMember.couple_id}/`;
  if (!filePath.startsWith(expectedPrefix)) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.storage
    .from('memories')
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete photo');
  }

  revalidatePath('/album');
}
