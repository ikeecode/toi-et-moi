import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Camera, ImageIcon } from 'lucide-react';
import { AddMemoryDialog } from '@/components/custom/add-memory-dialog';
import { MemoryCard } from '@/components/custom/memory-card';
import { BottomNav } from '@/components/custom/bottom-nav';

export default async function MemoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    redirect('/setup');
  }

  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('couple_id', coupleMember.couple_id)
    .order('date', { ascending: false });

  // Fetch photos for each memory
  const memoriesWithPhotos = await Promise.all(
    (memories ?? []).map(async (memory) => {
      const { data: photos } = await supabase
        .from('memory_photos')
        .select('*')
        .eq('memory_id', memory.id)
        .order('created_at', { ascending: true });

      return {
        ...memory,
        photos: photos ?? [],
        coverPhoto: photos?.[0]?.image_url ?? null,
      };
    })
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-40 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="surface-panel rounded-[2.2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Notre histoire</p>
                <h1 className="mt-2 text-3xl font-bold italic tracking-tight text-[#ecddfb] sm:text-4xl">
                  Souvenirs
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d7c0d1]">
                  Rassemblez les moments qui méritent d’être revus, avec juste
                  assez de structure pour que le plaisir reste intact.
                </p>
              </div>
              <AddMemoryDialog />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              {memoriesWithPhotos.length === 0 ? (
                <div className="surface-panel flex flex-col items-center justify-center gap-4 rounded-[2rem] py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffadf9]/20 to-[#ff77ff]/20">
                    <ImageIcon className="h-7 w-7 text-[#d7c0d1]/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#ecddfb]/80">
                      Aucun souvenir pour l&apos;instant
                    </p>
                    <p className="mt-1 text-sm text-[#d7c0d1]">
                      Commencez à capturer vos moments ensemble.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {memoriesWithPhotos.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      coverPhoto={memory.coverPhoto}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="surface-panel rounded-[1.9rem] p-5">
                <p className="section-kicker">Vue d’ensemble</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#f5e9ff]">
                  {memoriesWithPhotos.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                  {memoriesWithPhotos.length <= 1
                    ? 'moment enregistré dans votre histoire.'
                    : 'moments enregistrés dans votre histoire.'}
                </p>
              </div>

              <div className="surface-panel rounded-[1.9rem] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffadf9]/12 text-[#ffadf9]">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="mt-4 text-lg font-semibold text-[#f5e9ff]">
                  Galerie photo
                </p>
                <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                  Ouvrez une vue dédiée aux photos pour enrichir la partie la plus
                  visuelle de votre histoire.
                </p>
                <Link
                  href="/album"
                  className="mt-4 inline-flex text-sm font-medium text-[#ffbdf8] transition-colors hover:text-[#fff0ff]"
                >
                  Ouvrir la galerie
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BottomNav active="memories" />
    </div>
  );
}
