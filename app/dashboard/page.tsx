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
import { buttonVariants } from '@/components/ui/button';
import { BottomNav } from '@/components/custom/bottom-nav';
import { NicknameDialog } from '@/components/custom/nickname-dialog';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { daysTogether, formatEventDate } from '@/lib/helpers';

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
      detail: isMyTurn ? 'À vous de lancer la prochaine' : `Au tour de ${partnerDisplayName}`,
    },
    {
      label: 'Souvenirs partagés',
      value: `${memoriesCount ?? 0}`,
      detail: latestMemory ? latestMemory.title : 'Ajoutez votre premier moment',
    },
    {
      label: 'Dates enregistrées',
      value: `${eventsCount ?? 0}`,
      detail: nextEvent ? formatEventDate(nextEvent.date) : 'Aucune date à venir',
    },
  ];

  const actionCards = [
    {
      href: '/questions',
      title: '36 Questions',
      description: 'Poursuivre votre rituel de conversation',
      icon: MessageCircle,
      metric: `${questionCount ?? 0}/36`,
      accent: 'from-[#ffadf9]/20 to-[#ff77ff]/20',
    },
    {
      href: '/memories',
      title: 'Notre histoire',
      description: 'Revoir et enrichir vos souvenirs',
      icon: Heart,
      metric: latestMemory ? latestMemory.title : 'Ajouter un souvenir',
      accent: 'from-[#ffadf9]/18 to-[#d4bbff]/20',
    },
    {
      href: '/calendar',
      title: 'Agenda du couple',
      description: 'Garder vos prochains moments visibles',
      icon: Calendar,
      metric: nextEvent ? nextEvent.title : 'Planifier une prochaine date',
      accent: 'from-[#d4bbff]/20 to-[#ffadf9]/18',
    },
    {
      href: '/rules',
      title: 'Règlements',
      description: 'Vos règles de vie à deux, validées ensemble',
      icon: ShieldCheck,
      metric: 'Charte du couple',
      accent: 'from-emerald-400/20 to-[#d4bbff]/20',
    },
    {
      href: '/album',
      title: 'Galerie photo',
      description: 'Rassembler vos images préférées',
      icon: Camera,
      metric: memoriesCount ? `${memoriesCount} moment(s)` : 'Créer votre album',
      accent: 'from-[#84b7ff]/20 to-[#d4bbff]/20',
    },
  ];

  if (!hasPartner) {
    actionCards.unshift({
      href: '/invite',
      title: 'Inviter votre partenaire',
      description: 'Partager le lien d’accès à votre duo',
      icon: UserPlus,
      metric: 'Envoyer le lien',
      accent: 'from-[#ffd0f8]/20 to-[#d4bbff]/18',
    });
  }

  return (
    <div className="min-h-screen overflow-x-clip">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-40 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-light italic text-[#ffb0f4]">
              Toi et Moi
            </p>
            <p className="mt-1 text-sm text-[#baa6cd]">
              Un tableau de bord pensé pour reprendre le fil au bon endroit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ffadf9] to-[#ff77ff] text-sm font-bold text-[#37003a] shadow-[0_12px_32px_rgba(255,119,255,0.18)]">
              {myName.charAt(0).toUpperCase()}
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#d7c0d1] transition-colors hover:bg-white/[0.08] hover:text-[#fff1ff]"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Se déconnecter</span>
              </button>
            </form>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] lg:items-start">
          <div className="surface-panel rounded-[2.25rem] p-6 sm:p-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="section-kicker">Votre espace aujourd&apos;hui</p>
                <h1 className="break-words text-4xl font-semibold tracking-tight text-[#f5e9ff] sm:text-5xl">
                  {coupleName}
                </h1>

                <div className="flex flex-wrap gap-3">
                  {days !== null && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#ffadf9]/18 bg-[#ffadf9]/10 px-4 py-2 text-sm font-medium text-[#ffc6fb]">
                      <Sparkles className="h-4 w-4" />
                      {days} {days === 1 ? 'jour' : 'jours'} ensemble
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#e9dbf6]">
                    <span className="h-2 w-2 rounded-full bg-[#ffadf9]" />
                    {hasPartner ? 'Partenaire ajouté' : 'Partenaire en attente'}
                  </span>
                </div>
              </div>

              <div className="surface-panel-soft overflow-hidden rounded-[1.85rem] p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex shrink-0 -space-x-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#180f24] bg-gradient-to-br from-[#ffadf9] to-[#ff77ff] text-sm font-bold text-[#37003a]">
                      {myName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#180f24] bg-gradient-to-br from-[#d4bbff] to-[#ffadf9] text-sm font-bold text-[#37003a]">
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
                        <div className="min-w-0 overflow-hidden text-left transition-colors hover:text-[#ffbdf7]">
                          <p className="overflow-hidden text-ellipsis break-words text-base font-semibold leading-snug text-[#f3e8ff]">
                            {myName} & {partnerDisplayName}
                          </p>
                          <p className="mt-1 break-words text-sm text-[#baa6cd]">
                            {partnerNickname
                              ? `Petit nom personnalisé, prénom affiché: ${partnerRealName}.`
                              : 'Personnalisez le petit nom qui apparaît dans votre espace.'}
                          </p>
                        </div>
                      </NicknameDialog>
                    ) : (
                      <>
                        <p className="break-words text-base font-semibold leading-snug text-[#f3e8ff]">
                          {myName} & votre partenaire
                        </p>
                        <p className="mt-1 text-sm text-[#baa6cd]">
                          Invitez votre partenaire pour débloquer pleinement les rituels à deux.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={hasPartner ? '/questions' : '/invite'}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'min-w-0 h-12 rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] px-6 text-base font-bold text-[#37003a] shadow-[0_18px_50px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-transparent hover:text-[#37003a]'
                  )}
                >
                  {hasPartner ? 'Continuer le rituel' : 'Inviter mon partenaire'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/memories"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'min-w-0 h-12 rounded-full border-white/10 bg-white/[0.03] px-6 text-base text-[#f2e6ff] hover:bg-white/[0.08]'
                  )}
                >
                  Ajouter un souvenir
                </Link>
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[2.25rem] p-6 sm:p-8">
            <div className="space-y-5">
              <div>
                <p className="section-kicker">
                  {hasPartner ? 'À faire maintenant' : 'Prochaine action utile'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f5e9ff]">
                  {hasPartner
                    ? 'Question du jour'
                    : 'Invitez votre partenaire pour lancer le duo'}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#c7b3d6]">
                  {hasPartner
                    ? question
                    : "Une fois l'invitation envoyée, votre espace sera prêt à accueillir les questions, souvenirs et prochaines dates à vivre ensemble."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-panel-soft rounded-[1.6rem] p-4">
                  <p className="section-kicker">
                    {hasPartner ? 'Prochaine date' : 'Questions'}
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-[#f4e8ff]">
                    {hasPartner
                      ? nextEvent?.title || 'Aucun rendez-vous planifié'
                      : `${questionCount ?? 0} question(s) déjà abordée(s)`}
                  </p>
                  <p className="mt-1 text-sm text-[#baa6cd]">
                    {hasPartner
                      ? nextEvent
                        ? formatEventDate(nextEvent.date)
                        : 'Ajoutez un prochain moment à attendre.'
                      : 'Votre espace conserve déjà votre progression actuelle.'}
                  </p>
                </div>

                <div className="surface-panel-soft rounded-[1.6rem] p-4">
                  <p className="section-kicker">
                    {latestMemory ? 'Dernier souvenir' : 'Souvenirs'}
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-[#f4e8ff]">
                    {latestMemory?.title || 'Commencez votre histoire'}
                  </p>
                  <p className="mt-1 text-sm text-[#baa6cd]">
                    {latestMemory
                      ? formatEventDate(latestMemory.date)
                      : 'Ajoutez une photo ou un moment marquant à revoir plus tard.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="surface-panel-soft rounded-[1.75rem] p-5"
            >
              <p className="section-kicker">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#f5e9ff]">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                {stat.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Navigation utile</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f5e9ff]">
                Reprenez votre histoire au bon endroit
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#bfaad2]">
              Chaque carte mène vers une section avec une intention claire, pas
              simplement vers une fonctionnalité de plus.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actionCards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group surface-panel min-w-0 overflow-hidden rounded-[2rem] p-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-[#ffadf9]`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex max-w-[65%] shrink items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium text-[#e7d8f5]">
                      {item.metric}
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="break-words text-lg font-semibold tracking-tight text-[#f5e9ff]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
