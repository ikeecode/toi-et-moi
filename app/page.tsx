import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Camera,
  Heart,
  MessageCircle,
  Sparkles,
  Star,
  UserPlus,
} from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const featureCards = [
  {
    title: 'Question du jour',
    description:
      'Un point d’entrée simple pour relancer la conversation, même pendant les semaines chargées.',
    icon: MessageCircle,
  },
  {
    title: 'Souvenirs qui restent vivants',
    description:
      'Photos, moments marquants et petites histoires réunis dans une chronologie intime.',
    icon: Heart,
  },
  {
    title: 'Agenda relationnel',
    description:
      'Anniversaires, rendez-vous et jalons à venir restent visibles sans devenir administratifs.',
    icon: Calendar,
  },
];

const ritualSteps = [
  {
    label: '1. Ouvrez votre rituel',
    description:
      'Retrouvez la prochaine action utile dès l’accueil, sans chercher dans les menus.',
  },
  {
    label: '2. Partagez un moment',
    description:
      'Ajoutez une photo, une pensée ou une date pour nourrir votre histoire commune.',
  },
  {
    label: '3. Revenez naturellement',
    description:
      'L’application remet en avant ce qui compte aujourd’hui, pas toutes les fonctionnalités à la fois.',
  },
];

const previewMoments = [
  {
    title: 'Ce soir',
    body: 'Question du jour prête à être lancée',
    icon: Sparkles,
  },
  {
    title: 'Cette semaine',
    body: 'Un souvenir à compléter et une date à préparer',
    icon: Camera,
  },
  {
    title: 'À deux',
    body: 'Un espace partagé qui reste simple à reprendre',
    icon: UserPlus,
  },
];

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(255,173,249,0.18),_transparent_50%)]" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-[#7f5dff]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[#ff7de8]/10 blur-[140px]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-light italic tracking-tight text-[#ffb0f4]"
        >
          Toi et Moi
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#d7c0d1] transition-colors hover:text-[#fff2ff]"
          >
            Se connecter
          </Link>
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-10 rounded-full bg-white/[0.06] px-5 text-sm font-semibold text-[#f9efff] ring-1 ring-white/10 transition-all hover:bg-white/[0.1]'
            )}
          >
            Créer un espace
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#d7c0d1]/85">
                  Un espace numérique privé pour deux
                </span>
                <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                  <span className="hero-gradient-text">
                    Votre relation mérite mieux
                  </span>{' '}
                  <span className="text-[#f5e9ff]">
                    qu’une simple suite d’écrans.
                  </span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[#d7c0d1] sm:text-lg">
                  Toi et Moi transforme vos souvenirs, vos conversations et vos
                  rendez-vous en un rituel simple à retrouver. L’interface met
                  d’abord en avant ce que vous pouvez vivre aujourd’hui.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'h-12 rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] px-6 text-base font-bold text-[#37003a] shadow-[0_18px_50px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-transparent hover:text-[#37003a]'
                  )}
                >
                  Créer votre espace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'h-12 rounded-full border-white/10 bg-white/[0.03] px-6 text-base text-[#f2e6ff] hover:bg-white/[0.08]'
                  )}
                >
                  Reprendre mon espace
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-panel-soft rounded-[1.75rem] p-5">
                  <p className="text-3xl font-semibold text-[#f6ebff]">1</p>
                  <p className="mt-2 text-sm font-medium text-[#ecddfb]">
                    accueil utile
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#bda7d0]">
                    Une action claire au lieu d’un simple menu.
                  </p>
                </div>
                <div className="surface-panel-soft rounded-[1.75rem] p-5">
                  <p className="text-3xl font-semibold text-[#f6ebff]">3</p>
                  <p className="mt-2 text-sm font-medium text-[#ecddfb]">
                    rituels essentiels
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#bda7d0]">
                    Questions, souvenirs et agenda restent au centre.
                  </p>
                </div>
                <div className="surface-panel-soft rounded-[1.75rem] p-5">
                  <p className="text-3xl font-semibold text-[#f6ebff]">100%</p>
                  <p className="mt-2 text-sm font-medium text-[#ecddfb]">
                    pensé mobile
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#bda7d0]">
                    L’expérience fonctionne d’abord là où vous revenez le plus.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-[2rem] p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-[1.5rem] border border-white/8 bg-black/10 px-4 py-3">
                  <div>
                    <p className="section-kicker">Aujourd&apos;hui</p>
                    <p className="mt-1 text-sm font-medium text-[#f4e8ff]">
                      Votre couple revient sur l’essentiel
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffadf9]/14 text-[#ffadf9]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="section-kicker">Rituel de reprise</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f5e9ff]">
                        Une question à ouvrir, un souvenir à revoir, une date à préparer.
                      </h2>
                    </div>
                    <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#ffadf9]/12 text-[#ffadf9] sm:flex">
                      <Star className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {previewMoments.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="flex items-center gap-3 rounded-[1.25rem] border border-white/8 bg-black/10 px-4 py-3"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffadf9]/10 text-[#ffadf9]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#f4e8ff]">
                              {item.title}
                            </p>
                            <p className="text-sm leading-relaxed text-[#bda7d0]">
                              {item.body}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[1.5rem] bg-gradient-to-r from-[#2b1837] to-[#22132f] px-4 py-4">
                    <p className="text-sm font-medium text-[#f8ebff]">
                      “Quelle petite attention vous a récemment fait vous sentir aimé(e) ?”
                    </p>
                    <p className="mt-2 text-sm text-[#c7b1d7]">
                      Une façon simple de remettre la conversation au bon endroit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="section-kicker">Conçu pour la vraie vie à deux</p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#f5e9ff] sm:text-4xl">
                Un produit qui aide à vivre votre relation, pas juste à l’archiver.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#c5b1d4]">
              Chaque section répond à une intention claire: parler, se souvenir,
              s’organiser. Le design reste expressif, mais le parcours reste
              toujours évident.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="surface-panel rounded-[2rem] p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffadf9]/12 text-[#ffadf9]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-[#f5e9ff]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#c7b3d6]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="surface-panel rounded-[2.5rem] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div className="space-y-5">
                <p className="section-kicker">Comment ça fonctionne</p>
                <h2 className="text-3xl font-semibold tracking-tight text-[#f5e9ff] sm:text-4xl">
                  Trois gestes simples pour installer un rituel qui tient.
                </h2>
                <p className="text-sm leading-7 text-[#c6b1d5]">
                  La meilleure expérience couple n’est pas celle qui fait le plus.
                  C’est celle qui propose toujours la bonne prochaine action.
                </p>
              </div>

              <div className="space-y-4">
                {ritualSteps.map((step) => (
                  <div
                    key={step.label}
                    className="rounded-[1.75rem] border border-white/8 bg-black/10 px-5 py-5"
                  >
                    <p className="text-sm font-semibold text-[#f5e9ff]">
                      {step.label}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#bfaad2]">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-20 pt-10 text-center sm:px-6 lg:px-8 lg:pb-28">
          <div className="surface-panel rounded-[2.5rem] px-6 py-10 sm:px-10">
            <p className="section-kicker">Prêt à commencer</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#f5e9ff] sm:text-4xl">
              Offrez à votre histoire une interface qui donne envie d’être utilisée.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#c9b6d8] sm:text-base">
              Créez votre espace, invitez votre partenaire et transformez chaque
              retour dans l’app en une petite occasion de vous reconnecter.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-12 rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] px-6 text-base font-bold text-[#37003a] shadow-[0_18px_50px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-transparent hover:text-[#37003a]'
                )}
              >
                Créer votre espace
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-[#ffbff8] transition-colors hover:text-[#fff1ff]"
              >
                Déjà un compte ? Se connecter
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
