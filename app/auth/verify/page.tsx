import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { AuthShell } from '@/components/custom/auth-shell';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell
      kicker="Vérification"
      title="Confirmez votre email pour ouvrir l’espace."
      description="La création de compte est terminée. Il ne reste qu’une confirmation rapide pour sécuriser votre accès avant la première connexion."
      highlights={[
        {
          title: 'Un accès sécurisé',
          description: 'La vérification protège votre espace et évite les erreurs d’adresse email.',
        },
        {
          title: 'Une suite claire',
          description: 'Une fois confirmé, vous pourrez vous connecter et poursuivre la création de votre duo.',
        },
        {
          title: 'Un onboarding propre',
          description: 'Chaque étape garde un objectif simple pour ne pas casser l’élan.',
        },
      ]}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#ffadf9]/20 to-[#ff77ff]/20">
          <Mail className="h-8 w-8 text-[#ffadf9]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f5e9ff]">
            Vérifiez votre email
          </h2>
          <p className="text-sm leading-relaxed text-[#ccb8de]">
            Nous avons envoyé un lien de vérification à
          </p>
          {email && (
            <p className="font-medium text-[#ffadf9]">{email}</p>
          )}
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-[#bca8cf]">
          Cliquez sur le lien reçu par email, puis revenez vous connecter pour accéder à votre espace.
        </p>

        <Link
          href="/auth/login"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-12 w-full rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] text-base font-bold text-[#37003a] shadow-[0_16px_40px_rgba(255,119,255,0.22)] hover:-translate-y-0.5 hover:bg-transparent hover:text-[#37003a]'
          )}
        >
          Aller à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
