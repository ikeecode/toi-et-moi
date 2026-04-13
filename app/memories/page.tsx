import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Camera, ImageIcon } from 'lucide-react';
import { AddMemoryDialog } from '@/components/custom/add-memory-dialog';
import { MemoryCard } from '@/components/custom/memory-card';
import { BottomNav } from '@/components/custom/bottom-nav';
import {
  AppPage,
  EmptyState,
  InfoCard,
  PageHero,
  SurfacePanel,
} from '@/components/custom/page-shell';

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
      <AppPage>
        <div className="flex flex-col gap-6">
          <PageHero
            eyebrow="Notre histoire"
            title="Souvenirs"
            description="Moments et photos partagés."
            actions={<AddMemoryDialog />}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              {memoriesWithPhotos.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="Aucun souvenir pour l’instant"
                  description="Commencez par un moment simple. Une photo, une date et quelques mots suffisent pour lancer votre histoire."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {memoriesWithPhotos.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      coverPhoto={memory.coverPhoto}
                      photos={memory.photos}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <SurfacePanel>
                <p className="section-kicker">Vue d’ensemble</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {memoriesWithPhotos.length}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {memoriesWithPhotos.length <= 1
                    ? 'moment enregistré dans votre histoire.'
                    : 'moments enregistrés dans votre histoire.'}
                </p>
              </SurfacePanel>

              <InfoCard
                icon={Camera}
                title="Galerie photo"
                description="Toutes vos images."
              >
                <Link
                  href="/album"
                  className="inline-flex text-sm font-medium text-[#dbe7ff] transition-colors hover:text-[#eff4ff]"
                >
                  Ouvrir la galerie
                </Link>
              </InfoCard>
            </aside>
          </div>
        </div>
      </AppPage>

      <BottomNav active="memories" />
    </div>
  );
}
