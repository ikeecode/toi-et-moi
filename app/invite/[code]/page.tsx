import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Heart } from 'lucide-react';
import Link from 'next/link';

import { FormSubmitButton } from '@/components/custom/form-submit-button';
import { SurfacePanel } from '@/components/custom/page-shell';

export default async function InviteCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up couple by invite code
  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .eq('invite_code', code)
    .single();

  if (!couple) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <SurfacePanel className="w-full max-w-sm p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Invitation invalide</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce lien d&apos;invitation n&apos;est pas valide ou a expiré.
          </p>
          <Link href="/" className="cta-secondary mt-6">
            Retour à l’accueil
          </Link>
        </SurfacePanel>
      </div>
    );
  }

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signup?invite=${code}`);
  }

  // Check if user is already a member of this couple
  const { data: existingMember } = await supabase
    .from('couple_members')
    .select('id')
    .eq('couple_id', couple.id)
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    redirect('/dashboard');
  }

  // Check if user is already in another couple
  const { data: otherMembership } = await supabase
    .from('couple_members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (otherMembership) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <SurfacePanel className="w-full max-w-sm p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Déjà en couple</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous êtes déjà membre d&apos;un autre espace couple.
          </p>
          <Link href="/dashboard" className="cta-secondary mt-6">
            Ouvrir mon tableau de bord
          </Link>
        </SurfacePanel>
      </div>
    );
  }

  async function joinCouple() {
    'use server';

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    const displayName =
      user.user_metadata?.display_name || user.email?.split('@')[0] || 'Partenaire';

    await supabase.from('couple_members').insert({
      couple_id: couple!.id,
      user_id: user.id,
      role: 'partner',
      display_name: displayName,
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
  }

  const coupleName = couple.name || 'un espace partagé';

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <SurfacePanel className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="icon-chip h-14 w-14 rounded-[1.2rem]">
            <Heart className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              Rejoindre {coupleName} ?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous avez été invité(e) à rejoindre cet espace couple.
            </p>
          </div>
          <form action={joinCouple} className="w-full">
            <FormSubmitButton pendingLabel="Connexion à l’espace...">
              Rejoindre
            </FormSubmitButton>
          </form>
        </div>
      </SurfacePanel>
    </div>
  );
}
