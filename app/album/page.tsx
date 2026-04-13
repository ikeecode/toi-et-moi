import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Images } from 'lucide-react';
import { BottomNav } from '@/components/custom/bottom-nav';
import { AlbumPhotoGrid } from '@/components/custom/album-photo-grid';
import { AppPage, PageHero } from '@/components/custom/page-shell';

export default async function AlbumPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    redirect('/setup');
  }

  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleMember.couple_id)
    .single();

  if (!couple) {
    redirect('/setup');
  }

  // Fetch all photos from Supabase Storage at album/{couple_id}/
  const albumPath = `album/${couple.id}`;
  const { data: files } = await supabase.storage
    .from('memories')
    .list(albumPath, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  const photos = (files || [])
    .filter((file) => file.name !== '.emptyFolderPlaceholder')
    .map((file) => {
      const {
        data: { publicUrl },
      } = supabase.storage
        .from('memories')
        .getPublicUrl(`${albumPath}/${file.name}`);

      return {
        name: file.name,
        url: publicUrl,
      };
    });

  return (
    <div className="min-h-screen">
      <AppPage>
        <PageHero
          eyebrow="Histoire visuelle"
          title="Album photo"
          description="Une galerie dédiée à vos images les plus importantes, pour que la partie la plus émotionnelle de votre histoire reste facile à revoir."
          badge={
            <div className="soft-chip text-sm">
              <Images className="h-4 w-4 text-[#8fb2ff]" />
              {photos.length} photo{photos.length > 1 ? 's' : ''}
            </div>
          }
          actions={
            <Link href="/dashboard" className="cta-secondary h-11 w-11 rounded-full px-0">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Retour</span>
            </Link>
          }
        />
        <AlbumPhotoGrid photos={photos} coupleId={couple.id} />
      </AppPage>

      <BottomNav active="memories" />
    </div>
  );
}
