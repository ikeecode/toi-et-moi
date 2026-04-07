import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getInviteUrl } from '@/lib/helpers';
import Link from 'next/link';
import { ArrowLeft, Copy, Send, UserPlus } from 'lucide-react';
import { CopyButton } from '@/components/custom/copy-button';

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
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#d7c0d1] transition-colors hover:text-[#ffadf9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <section className="surface-panel rounded-[2.2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffadf9]/20 to-[#ff77ff]/20">
                <UserPlus className="h-8 w-8 text-[#ffadf9]" />
              </div>

              <div>
                <p className="section-kicker">Partager votre duo</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f5e9ff] sm:text-4xl">
                  Invitez votre partenaire avec un lien simple à ouvrir.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c7b3d6]">
                  Une fois ce lien partagé, votre partenaire pourra créer son
                  compte ou rejoindre directement l’espace existant. L’objectif
                  est de rendre l’entrée dans l’app aussi fluide que le reste.
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-white/8 bg-black/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <code className="break-all text-sm leading-7 text-[#ffbdf8]">
                    {inviteUrl}
                  </code>
                  <CopyButton text={inviteUrl} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-panel-soft rounded-[1.5rem] p-4">
                  <Copy className="h-5 w-5 text-[#ffadf9]" />
                  <p className="mt-3 text-sm font-semibold text-[#f5e9ff]">
                    Copier le lien
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                    Une action directe, claire et rapide à comprendre.
                  </p>
                </div>
                <div className="surface-panel-soft rounded-[1.5rem] p-4">
                  <Send className="h-5 w-5 text-[#ffadf9]" />
                  <p className="mt-3 text-sm font-semibold text-[#f5e9ff]">
                    Envoyer où vous voulez
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                    WhatsApp, SMS ou email: le parcours reste le même.
                  </p>
                </div>
                <div className="surface-panel-soft rounded-[1.5rem] p-4">
                  <UserPlus className="h-5 w-5 text-[#ffadf9]" />
                  <p className="mt-3 text-sm font-semibold text-[#f5e9ff]">
                    Rejoindre l’espace
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                    Votre partenaire retrouve ensuite l’onboarding au bon endroit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="surface-panel rounded-[2.2rem] p-6">
            <p className="section-kicker">Bon à savoir</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f5e9ff]">
              L’invitation doit inspirer confiance en quelques secondes.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#baa6cd]">
              Le lien affiché reprend l’origine réelle de l’application pour
              éviter les surprises entre environnement local, preview ou domaine
              final.
            </p>
            <div className="mt-5 rounded-[1.6rem] border border-white/8 bg-black/10 p-4">
              <p className="text-sm font-semibold text-[#f5e9ff]">
                Conseil UX
              </p>
              <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                Accompagnez le lien d’un message personnel. Le taux de réponse
                est souvent meilleur qu’avec un simple copier-coller brut.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
