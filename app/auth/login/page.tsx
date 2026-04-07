import Link from 'next/link';
import { login } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/custom/auth-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      kicker="Accès privé"
      title="Retrouvez votre espace à deux sans friction."
      description="Vos souvenirs, vos questions et vos dates importantes restent au même endroit, dans une interface pensée pour reprendre le fil en quelques secondes."
      highlights={[
        {
          title: 'Tout reprendre au bon moment',
          description: 'Question du jour, souvenirs récents et prochains rendez-vous sont visibles tout de suite.',
        },
        {
          title: 'Une expérience intime',
          description: 'Le design reste doux et calme pour laisser la place à votre histoire, pas à l’interface.',
        },
        {
          title: 'Un espace simple à partager',
          description: 'Invitez votre partenaire et poursuivez vos rituels au même endroit.',
        },
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f5e9ff]">
            Bon retour
          </h2>
          <p className="text-sm leading-relaxed text-[#ccb8de]">
            Connectez-vous pour reprendre votre espace couple exactement là où vous l’avez laissé.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form action={login} className="space-y-5">
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
                Rouvrez votre espace en un instant
              </span>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Votre mot de passe"
              required
              autoComplete="current-password"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-[#f6ebff] placeholder:text-[#9f8aae] focus:border-[#ffadf9]/40 focus-visible:ring-[#ffadf9]/20"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-12 w-full rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] text-base font-bold text-[#37003a] shadow-[0_16px_40px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(255,119,255,0.28)]"
          >
            Se connecter
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <Sparkles className="size-3 text-[#ffadf9]/50" />
          <div className="h-px flex-1 bg-white/8" />
        </div>

        <p className="text-center text-sm text-[#bca8cf]">
          Pas encore de compte ?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-[#ffadf9] underline underline-offset-4 transition-colors hover:text-[#ffd1fc]"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
