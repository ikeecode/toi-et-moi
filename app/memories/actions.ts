'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateImageUpload } from '@/lib/image-upload';

export async function createMemory(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Vous devez être connecté pour ajouter un souvenir.');

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('Aucun espace couple trouvé.');

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
      couple_id: coupleMember.couple_id,
      title,
      description: description || null,
      date,
      created_by: user.id,
    })
    .select()
    .single();

  if (memoryError || !memory) {
    throw new Error('Impossible de créer ce souvenir.');
  }

  for (const image of images) {
    const fileExt = image.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${coupleMember.couple_id}/${memory.id}/${fileName}`;

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

  revalidatePath('/memories');
}

export async function updateMemory(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Vous devez être connecté pour modifier un souvenir.');
  }

  const memoryId = formData.get('memoryId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const removedPhotoIds = formData.getAll('removedPhotoIds') as string[];
  const newImages = (formData.getAll('newImages') as File[]).filter(
    (image) => image && image.size > 0
  );

  if (!memoryId || !title || !date)
    throw new Error('Le titre et la date sont requis.');

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('Aucun espace couple trouvé.');

  const { data: memory } = await supabase
    .from('memories')
    .select('id, couple_id')
    .eq('id', memoryId)
    .eq('couple_id', coupleMember.couple_id)
    .single();

  if (!memory) throw new Error('Souvenir introuvable.');

  await supabase
    .from('memories')
    .update({ title, description: description || null, date })
    .eq('id', memoryId);

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

      await supabase
        .from('memory_photos')
        .delete()
        .in('id', removedPhotoIds);
    }
  }

  if (newImages.length > 0) {
    const validationError = validateImageUpload(newImages);
    if (validationError) throw new Error(validationError);

    for (const image of newImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${coupleMember.couple_id}/${memoryId}/${fileName}`;

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
    }
  }

  revalidatePath('/memories');
}

export async function deleteMemory(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Vous devez être connecté pour supprimer un souvenir.');
  }

  const memoryId = formData.get('memoryId') as string;
  if (!memoryId) throw new Error("L'identifiant du souvenir est requis.");

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) throw new Error('Aucun espace couple trouvé.');

  const { data: memory } = await supabase
    .from('memories')
    .select('id, couple_id')
    .eq('id', memoryId)
    .eq('couple_id', coupleMember.couple_id)
    .single();

  if (!memory) throw new Error('Souvenir introuvable.');

  // Delete photos from storage
  const storagePath = `${coupleMember.couple_id}/${memoryId}`;
  const { data: files } = await supabase.storage
    .from('memories')
    .list(storagePath);

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${storagePath}/${file.name}`);
    await supabase.storage.from('memories').remove(filePaths);
  }

  await supabase.from('memory_photos').delete().eq('memory_id', memoryId);
  await supabase.from('memories').delete().eq('id', memoryId);

  revalidatePath('/memories');
}
