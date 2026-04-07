import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/custom/auth-shell';
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
          <h2 className="text-3xl font-semibold tracking-tight text-[#f5e9ff]">
            Créez votre espace
          </h2>
          <p className="text-sm leading-relaxed text-[#ccb8de]">
            Configurez votre espace couple avec les repères essentiels pour commencer sur de bonnes bases.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form action={createCoupleSpace} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="couple_name"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7c0d1]"
            >
              Nom du couple
            </Label>
            <Input
              id="couple_name"
              name="couple_name"
              type="text"
              placeholder='Ex. "Jean & Marie"'
              autoComplete="off"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-[#f6ebff] placeholder:text-[#9f8aae] focus:border-[#ffadf9]/40 focus-visible:ring-[#ffadf9]/20"
            />
            <p className="text-xs text-[#b59dc7]">
              Optionnel. Vous pourrez le modifier plus tard.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="anniversary"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7c0d1]"
            >
              Date importante
            </Label>
            <Input
              id="anniversary"
              name="anniversary"
              type="date"
              required
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-[#f6ebff] focus:border-[#ffadf9]/40 focus-visible:ring-[#ffadf9]/20"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-12 w-full rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] text-base font-bold text-[#37003a] shadow-[0_16px_40px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(255,119,255,0.28)]"
          >
            Commencer notre voyage
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
