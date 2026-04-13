import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/custom/auth-shell';
import { Sparkles } from 'lucide-react';
import { LoginForm } from '@/components/custom/login-form';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const { error } = await searchParams;

  return (
    <AuthShell
      kicker="Accès privé"
      title="Retrouvez votre espace à deux sans friction."
      description="Connexion rapide."
      highlights={[
        {
          title: 'Toujours prêt',
          description: 'Votre espace reste accessible sans repartir de zéro.',
        },
        {
          title: 'Session gardée',
          description: 'La connexion reste active sur votre appareil.',
        },
        {
          title: 'Retour immédiat',
          description: 'Ouvrez et reprenez là où vous étiez.',
        },
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Bon retour
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Connectez-vous pour reprendre votre espace couple exactement là où
            vous l’avez laissé.
          </p>
        </div>

        {error && (
          <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <LoginForm />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <Sparkles className="size-3 text-[#8fb2ff]/70" />
          <div className="h-px flex-1 bg-white/8" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-[#dbe7ff] underline underline-offset-4 transition-colors hover:text-[#eff4ff]"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
