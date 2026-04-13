import Link from 'next/link';
import { signup } from '@/app/auth/actions';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/custom/auth-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { FormSubmitButton } from '@/components/custom/form-submit-button';
import { createClient } from '@/lib/supabase/server';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

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
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {invite ? 'Rejoignez votre espace' : 'Commencez votre histoire'}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {invite
              ? 'Créez votre compte pour accepter l’invitation et rejoindre votre partenaire.'
              : 'Créez un compte pour démarrer votre espace couple avec une base claire et élégante.'}
          </p>
        </div>

        {error && (
          <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form action={signup} className="space-y-5">
          {invite && <input type="hidden" name="invite" value={invite} />}

          <div className="space-y-2">
            <Label htmlFor="display_name" className="form-label">
              Nom d&apos;affichage
            </Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="Votre prénom"
              required
              autoComplete="name"
              className="text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="form-label">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password" className="form-label">
                Mot de passe
              </Label>
              <span className="text-xs text-muted-foreground">
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
              className="text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <FormSubmitButton
            className="mt-2"
            pendingLabel={invite ? 'Création en cours...' : 'Création...'}
          >
            {invite ? 'Créer et rejoindre' : 'Créer un compte'}
          </FormSubmitButton>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <Sparkles className="size-3 text-[#8fb2ff]/70" />
          <div className="h-px flex-1 bg-white/8" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-[#dbe7ff] underline underline-offset-4 transition-colors hover:text-[#eff4ff]"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
