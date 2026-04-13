import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  Camera,
  Heart,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';

import { signOut } from '@/app/auth/actions';
import { BottomNav } from '@/components/custom/bottom-nav';
import { NicknameDialog } from '@/components/custom/nickname-dialog';
import {
  AppPage,
  StatCard,
  SurfacePanel,
} from '@/components/custom/page-shell';
import { createClient } from '@/lib/supabase/server';
import { daysTogether, formatEventDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';

const romanticQuestions = [
  'Quel moment vous a fait réaliser pour la première fois que vous tombiez amoureux(se) ?',
  'Quel est votre souvenir préféré de nous ensemble ?',
  "Si nous pouvions voyager n'importe où demain, où voudriez-vous aller ?",
  'Quelle chanson vous fait penser à nous ?',
  "Qu'aimez-vous le plus dans notre relation ?",
  "Qu'est-ce que je fais qui vous fait toujours sourire ?",
  'Quel rêve voulez-vous que nous poursuivions ensemble ?',
  'Quelle a été la chose la plus inattendue en tombant amoureux(se) de moi ?',
  'Si vous pouviez revivre une journée passée ensemble, laquelle serait-ce ?',
  'Que représente le foyer pour vous ?',
  'Quel petit geste de ma part compte énormément pour vous ?',
  'Comment savez-vous quand vous vous sentez le plus aimé(e) ?',
  'Quelle aventure devrions-nous vivre ensuite ?',
  'Quelle est la chose que vous voulez que nous ne cessions jamais de faire ?',
  'À quoi ressemble notre avenir à vos yeux ?',
];

function getQuestionOfTheDay(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return romanticQuestions[dayOfYear % romanticQuestions.length];
}

export default async function DashboardPage() {
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

  const { data: partner } = await supabase
    .from('couple_members')
    .select('*')
    .eq('couple_id', couple.id)
    .neq('user_id', user.id)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const [
    { count: questionCount },
    { count: memoriesCount },
    { count: eventsCount },
    { data: questionProgress },
    { data: upcomingEvents },
    { data: latestMemories },
  ] = await Promise.all([
    supabase
      .from('questions_progress')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', couple.id),
    supabase
      .from('memories')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', couple.id),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', couple.id),
    supabase
      .from('questions_progress')
      .select('completed_by')
      .eq('couple_id', couple.id)
      .order('completed_at', { ascending: false })
      .limit(1),
    supabase
      .from('events')
      .select('title, date')
      .eq('couple_id', couple.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1),
    supabase
      .from('memories')
      .select('title, date')
      .eq('couple_id', couple.id)
      .order('date', { ascending: false })
      .limit(1),
  ]);

  const hasPartner = !!partner;
  const coupleName = couple.name || 'Votre espace';
  const days = couple.anniversary_date
    ? daysTogether(couple.anniversary_date)
    : null;
  const question = getQuestionOfTheDay();
  const nextEvent = upcomingEvents?.[0] ?? null;
  const latestMemory = latestMemories?.[0] ?? null;
  const lastQuestionBy = questionProgress?.[0]?.completed_by ?? null;
  const isMyTurn = lastQuestionBy === null || lastQuestionBy !== user.id;

  const myName =
    coupleMember.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Vous';

  const partnerRealName = partner?.display_name || 'Votre partenaire';
  const partnerNickname: string | null = coupleMember.nickname ?? null;
  const partnerDisplayName = partnerNickname || partnerRealName;

  const stats = [
    {
      label: 'Questions abordées',
      value: `${questionCount ?? 0}/36`,
      detail: isMyTurn ? 'À vous' : `Tour de ${partnerDisplayName}`,
    },
    {
      label: 'Souvenirs partagés',
      value: `${memoriesCount ?? 0}`,
      detail: latestMemory ? latestMemory.title : 'Aucun',
    },
    {
      label: 'Dates enregistrées',
      value: `${eventsCount ?? 0}`,
      detail: nextEvent ? formatEventDate(nextEvent.date) : 'Aucune',
    },
  ];

  const actionCards = [
    {
      href: '/questions',
      title: '36 Questions',
      icon: MessageCircle,
      metric: `${questionCount ?? 0}/36`,
      accent: 'from-[#8fb2ff]/18 to-[#6c95ff]/16',
    },
    {
      href: '/memories',
      title: 'Notre histoire',
      icon: Heart,
      metric: latestMemory ? latestMemory.title : 'Ajouter un souvenir',
      accent: 'from-[#b8c9ff]/18 to-[#7f98e8]/16',
    },
    {
      href: '/calendar',
      title: 'Agenda du couple',
      icon: Calendar,
      metric: nextEvent ? nextEvent.title : 'Planifier une prochaine date',
      accent: 'from-[#a7bfff]/18 to-[#5c78c7]/16',
    },
    {
      href: '/rules',
      title: 'Règlements',
      icon: ShieldCheck,
      metric: 'Charte du couple',
      accent: 'from-emerald-400/18 to-[#4d669f]/20',
    },
    {
      href: '/album',
      title: 'Galerie photo',
      icon: Camera,
      metric: memoriesCount ? `${memoriesCount} moment(s)` : 'Créer votre album',
      accent: 'from-sky-400/18 to-[#4d669f]/20',
    },
  ];

  if (!hasPartner) {
    actionCards.unshift({
      href: '/invite',
      title: 'Inviter votre partenaire',
      icon: UserPlus,
      metric: 'Envoyer le lien',
      accent: 'from-[#b8c9ff]/18 to-[#6c95ff]/16',
    });
  }

  return (
    <div className="min-h-screen overflow-x-clip">
      <AppPage>
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-lg font-light italic tracking-tight text-[#dbe7ff]">
              Toi et Moi
            </p>
            <p className="text-sm text-muted-foreground">Aujourd&apos;hui</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8fb2ff] text-sm font-semibold text-[#09111f] shadow-[0_10px_24px_rgba(143,178,255,0.2)]">
              {myName.charAt(0).toUpperCase()}
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="cta-secondary h-11 w-11 rounded-full px-0"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Se déconnecter</span>
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-start">
          <SurfacePanel className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {days !== null && (
                <span className="accent-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  {days} {days === 1 ? 'jour' : 'jours'} ensemble
                </span>
              )}
              <span className="soft-chip">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    hasPartner ? 'bg-emerald-300' : 'bg-amber-300'
                  )}
                />
                {hasPartner ? 'Partenaire ajouté' : 'Partenaire en attente'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="section-kicker">Votre espace</p>
                <h1 className="mt-2 break-words text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {coupleName}
                </h1>
              </div>

              <SurfacePanel tone="soft" className="p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex shrink-0 -space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#0b0d12] bg-[#8fb2ff] text-sm font-semibold text-[#09111f]">
                      {myName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#0b0d12] bg-[#6f86c9] text-sm font-semibold text-[#09111f]">
                      {partnerDisplayName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    {hasPartner ? (
                      <NicknameDialog
                        partnerId={partner!.user_id}
                        partnerDisplayName={partnerRealName}
                        currentNickname={partnerNickname}
                      >
                        <div className="min-w-0 overflow-hidden text-left transition-colors hover:text-[#f6e9e1]">
                          <p className="overflow-hidden text-ellipsis break-words text-base font-semibold leading-snug text-foreground">
                            {myName} & {partnerDisplayName}
                          </p>
                          <p className="mt-1 break-words text-sm text-muted-foreground">
                            {partnerNickname ? partnerRealName : 'Modifier le nom affiché'}
                          </p>
                        </div>
                      </NicknameDialog>
                    ) : (
                      <>
                        <p className="break-words text-base font-semibold leading-snug text-foreground">
                          {myName} & votre partenaire
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">Partenaire manquant</p>
                      </>
                    )}
                  </div>
                </div>
              </SurfacePanel>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SurfacePanel tone="soft" className="p-4 sm:p-5">
                <p className="section-kicker">
                  {hasPartner ? 'Prochaine date' : 'Rituel'}
                </p>
                <p className="mt-2 break-words text-base font-semibold text-foreground">
                  {hasPartner
                    ? nextEvent?.title || 'Aucun rendez-vous planifié'
                    : `${questionCount ?? 0} question(s) déjà abordée(s)`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasPartner
                    ? nextEvent
                      ? formatEventDate(nextEvent.date)
                      : 'Aucun'
                    : 'Progression prête'}
                </p>
              </SurfacePanel>

              <SurfacePanel tone="soft" className="p-4 sm:p-5">
                <p className="section-kicker">
                  {latestMemory ? 'Dernier souvenir' : 'Souvenirs'}
                </p>
                <p className="mt-2 break-words text-base font-semibold text-foreground">
                  {latestMemory?.title || 'Commencez votre histoire'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latestMemory
                      ? formatEventDate(latestMemory.date)
                      : 'Aucun'}
                </p>
              </SurfacePanel>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={hasPartner ? '/questions' : '/invite'} className="cta-primary">
                {hasPartner ? 'Continuer le rituel' : 'Inviter mon partenaire'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/memories" className="cta-secondary">
                Ajouter un souvenir
              </Link>
            </div>
          </SurfacePanel>

          <SurfacePanel className="space-y-5">
            <SurfacePanel tone="soft" className="p-4 sm:p-5">
              <p className="section-kicker">Question du jour</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {hasPartner ? question : 'Invitez votre partenaire'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isMyTurn ? 'À vous' : `Tour de ${partnerDisplayName}`}
              </p>
            </SurfacePanel>

            <SurfacePanel tone="soft" className="p-4 sm:p-5">
              <p className="section-kicker">
                {nextEvent ? 'Prochain repère' : 'Agenda'}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {nextEvent?.title || 'Aucune date enregistrée'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextEvent
                  ? formatEventDate(nextEvent.date)
                  : 'Rien à venir'}
              </p>
            </SurfacePanel>

            <SurfacePanel tone="soft" className="p-4 sm:p-5">
              <p className="section-kicker">
                {latestMemory ? 'À revoir' : 'Histoire'}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {latestMemory?.title || 'Ajoutez votre premier souvenir'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestMemory ? formatEventDate(latestMemory.date) : 'Rien pour le moment'}
              </p>
            </SurfacePanel>
          </SurfacePanel>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              detail={stat.detail}
            />
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <p className="section-kicker">Accès rapides</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actionCards.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href} className="group block h-full">
                  <SurfacePanel className="h-full transition-transform duration-200 group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-[#f0d2c6]`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="soft-chip max-w-[65%] shrink overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.metric}
                      </span>
                    </div>
                    <div className="mt-5">
                      <p className="break-words text-lg font-semibold tracking-tight text-foreground">
                        {item.title}
                      </p>
                    </div>
                  </SurfacePanel>
                </Link>
              );
            })}
          </div>
        </section>
      </AppPage>

      <BottomNav active="dashboard" />
    </div>
  );
}
