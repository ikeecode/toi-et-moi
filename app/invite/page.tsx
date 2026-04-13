import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getInviteUrl } from '@/lib/helpers';
import Link from 'next/link';
import { ArrowLeft, Copy, Send, UserPlus } from 'lucide-react';
import { CopyButton } from '@/components/custom/copy-button';
import { AppPage, InfoCard, PageHero, SurfacePanel } from '@/components/custom/page-shell';

export default async function InvitePage() {
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

  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleMember.couple_id)
    .single();

  if (!couple) {
    redirect('/setup');
  }

  const headerStore = await headers();
  const host =
    headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? null;
  const proto =
    headerStore.get('x-forwarded-proto') ??
    (host?.includes('localhost') || host?.startsWith('127.0.0.1')
      ? 'http'
      : 'https');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : undefined);
  const inviteUrl = getInviteUrl(couple.invite_code, baseUrl);

  return (
    <div className="min-h-screen">
      <AppPage bottomInset={false} className="max-w-5xl pb-16">
        <PageHero
          eyebrow="Partager votre duo"
          title="Invitez votre partenaire avec un lien simple à ouvrir."
          description="Une fois ce lien partagé, votre partenaire pourra créer son compte ou rejoindre directement l’espace existant. L’objectif est de rendre l’entrée dans l’app aussi fluide que le reste."
          actions={
            <Link href="/dashboard" className="cta-secondary h-11 w-11 rounded-full px-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Retour</span>
            </Link>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <section className="space-y-6">
            <SurfacePanel>
              <div className="flex flex-col gap-6">
                <div className="icon-chip h-16 w-16 rounded-[1.4rem]">
                  <UserPlus className="h-8 w-8" />
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-black/10 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <code className="break-all text-sm leading-7 text-[#dbe7ff]">
                      {inviteUrl}
                    </code>
                    <CopyButton text={inviteUrl} />
                  </div>
                </div>
              </div>
            </SurfacePanel>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard
                icon={Copy}
                title="Copier le lien"
                description="Une action directe, claire et rapide à comprendre."
              />
              <InfoCard
                icon={Send}
                title="Envoyer où vous voulez"
                description="WhatsApp, SMS ou email: le parcours reste le même."
              />
              <InfoCard
                icon={UserPlus}
                title="Rejoindre l’espace"
                description="Votre partenaire retrouve ensuite l’onboarding au bon endroit."
              />
            </div>
          </section>

          <aside>
            <SurfacePanel className="h-full">
              <p className="section-kicker">Bon à savoir</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                L’invitation doit inspirer confiance en quelques secondes.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Le lien affiché reprend l’origine réelle de l’application pour
                éviter les surprises entre environnement local, preview ou domaine
                final.
              </p>
              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/10 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Conseil UX
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Accompagnez le lien d’un message personnel. Le taux de réponse
                  est souvent meilleur qu’avec un simple copier-coller brut.
                </p>
              </div>
            </SurfacePanel>
          </aside>
        </div>
      </AppPage>
    </div>
  );
}
