import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Images } from 'lucide-react';
import { BottomNav } from '@/components/custom/bottom-nav';
import { AlbumPhotoGrid } from '@/components/custom/album-photo-grid';

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
      <div className="mx-auto max-w-6xl px-4 py-8 pb-40 sm:px-6 lg:px-8">
        <div className="surface-panel rounded-[2.2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/dashboard"
                className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#d7c0d1] transition-colors hover:bg-white/[0.08] hover:text-[#ffadf9]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div>
                <p className="section-kicker">Histoire visuelle</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#ecddfb]">
                  Album Photo
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d7c0d1]">
                  Une galerie dédiée à vos images les plus importantes, pour que
                  la partie la plus émotionnelle de votre histoire reste facile à
                  revoir.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f0e3fb]">
              <Images className="h-4 w-4 text-[#ffadf9]" />
              {photos.length} photo{photos.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <AlbumPhotoGrid photos={photos} coupleId={couple.id} />
      </div>

      <BottomNav active="memories" />
    </div>
  );
}
