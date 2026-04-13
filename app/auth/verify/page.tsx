import Link from 'next/link';
import { AuthShell } from '@/components/custom/auth-shell';
import { Mail } from 'lucide-react';

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
        <div className="icon-chip h-16 w-16 rounded-[1.5rem]">
          <Mail className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Vérifiez votre email
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nous avons envoyé un lien de vérification à
          </p>
          {email && (
            <p className="font-medium text-[#dbe7ff]">{email}</p>
          )}
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Cliquez sur le lien reçu par email, puis revenez vous connecter pour
          accéder à votre espace.
        </p>

        <Link href="/auth/login" className="cta-primary w-full">
          Aller à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
