import { AuthShell } from '@/components/custom/auth-shell';
import { FormSubmitButton } from '@/components/custom/form-submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCoupleSpace } from './actions';

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      kicker="Dernière étape"
      title="Donnez une forme claire à votre espace partagé."
      description="Un nom, une date importante, puis l’application s’organise autour de votre duo. Le reste pourra évoluer plus tard."
      highlights={[
        {
          title: 'Un espace qui vous ressemble',
          description: 'Le nom du couple et la date clé installent immédiatement une identité commune.',
        },
        {
          title: 'Des repères dès le départ',
          description: 'Le compteur de jours, les rappels et les souvenirs s’appuient sur cette base.',
        },
        {
          title: 'Aucun réglage superflu',
          description: 'Seulement les informations qui améliorent vraiment l’expérience dès le premier jour.',
        },
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Créez votre espace
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Configurez votre espace couple avec les repères essentiels pour
            commencer sur de bonnes bases.
          </p>
        </div>

        {error && (
          <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form action={createCoupleSpace} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="couple_name" className="form-label">
              Nom du couple
            </Label>
            <Input
              id="couple_name"
              name="couple_name"
              type="text"
              placeholder='Ex. "Jean & Marie"'
              autoComplete="off"
              className="text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Optionnel. Vous pourrez le modifier plus tard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anniversary" className="form-label">
              Date importante
            </Label>
            <Input
              id="anniversary"
              name="anniversary"
              type="date"
              required
              className="text-foreground"
            />
          </div>

          <FormSubmitButton className="mt-2" pendingLabel="Création...">
            Commencer notre voyage
          </FormSubmitButton>
        </form>
      </div>
    </AuthShell>
  );
}
