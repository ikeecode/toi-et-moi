import Link from 'next/link';
import { signup } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/custom/auth-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const { error, invite } = await searchParams;

  return (
    <AuthShell
      kicker={invite ? 'Invitation reçue' : 'Créer votre duo'}
      title={invite ? 'Rejoignez cet espace à deux sans détour.' : 'Créez un espace couple qui donne envie de revenir.'}
      description={invite ? 'Votre partenaire vous attend déjà. Créez votre compte pour rejoindre directement votre espace partagé.' : 'En quelques étapes, vous obtenez un endroit pour garder vos souvenirs, lancer des conversations et organiser vos prochains moments ensemble.'}
      highlights={[
        {
          title: 'Un démarrage guidé',
          description: 'Le parcours vous mène directement vers la création ou la jonction de votre espace.',
        },
        {
          title: 'Des rituels simples',
          description: 'Questions, souvenirs et agenda sont prêts à être utilisés dès la première connexion.',
        },
        {
          title: 'Une ambiance premium',
          description: 'L’expérience reste soignée et intime, même dans les écrans les plus utilitaires.',
        },
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f5e9ff]">
            {invite ? 'Rejoignez votre espace' : 'Commencez votre histoire'}
          </h2>
          <p className="text-sm leading-relaxed text-[#ccb8de]">
            {invite
              ? 'Créez votre compte pour accepter l’invitation et rejoindre votre partenaire.'
              : 'Créez un compte pour démarrer votre espace couple avec une base claire et élégante.'}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form action={signup} className="space-y-5">
          {invite && <input type="hidden" name="invite" value={invite} />}

          <div className="space-y-2">
            <Label
              htmlFor="display_name"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7c0d1]"
            >
              Nom d&apos;affichage
            </Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="Votre prénom"
              required
              autoComplete="name"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-[#f6ebff] placeholder:text-[#9f8aae] focus:border-[#ffadf9]/40 focus-visible:ring-[#ffadf9]/20"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7c0d1]"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-[#f6ebff] placeholder:text-[#9f8aae] focus:border-[#ffadf9]/40 focus-visible:ring-[#ffadf9]/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7c0d1]"
              >
                Mot de passe
              </Label>
              <span className="text-xs text-[#b59dc7]">
                Minimum 6 caractères
              </span>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Choisissez un mot de passe"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-[#f6ebff] placeholder:text-[#9f8aae] focus:border-[#ffadf9]/40 focus-visible:ring-[#ffadf9]/20"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-12 w-full rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] text-base font-bold text-[#37003a] shadow-[0_16px_40px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(255,119,255,0.28)]"
          >
            {invite ? 'Créer et rejoindre' : 'Créer un compte'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <Sparkles className="size-3 text-[#ffadf9]/50" />
          <div className="h-px flex-1 bg-white/8" />
        </div>

        <p className="text-center text-sm text-[#bca8cf]">
          Déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-[#ffadf9] underline underline-offset-4 transition-colors hover:text-[#ffd1fc]"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
