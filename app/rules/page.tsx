import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { ProposeRuleDialog } from '@/components/custom/propose-rule-dialog';
import { RuleList, type Rule } from '@/components/custom/rule-list';
import { BottomNav } from '@/components/custom/bottom-nav';
import { AppPage, InfoCard, PageHero, SurfacePanel } from '@/components/custom/page-shell';

export default async function RulesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    redirect('/setup');
  }

  const { data: partner } = await supabase
    .from('couple_members')
    .select('display_name')
    .eq('couple_id', coupleMember.couple_id)
    .neq('user_id', user.id)
    .single();

  const { data: rules } = await supabase
    .from('rules')
    .select('id, text, proposed_by, status, created_at')
    .eq('couple_id', coupleMember.couple_id)
    .order('created_at', { ascending: false });

  const typedRules: Rule[] = (rules ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    proposed_by: r.proposed_by,
    status: r.status as Rule['status'],
    created_at: r.created_at,
  }));

  const approvedCount = typedRules.filter((r) => r.status === 'approved').length;
  const pendingCount = typedRules.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen">
      <AppPage>
        <div className="flex flex-col gap-6">
          <PageHero
            eyebrow="Charte du couple"
            title="Règlements"
            description="Vos accords à deux."
            actions={<ProposeRuleDialog />}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <SurfacePanel>
              <RuleList
                rules={typedRules}
                userId={user.id}
                partnerName={partner?.display_name ?? null}
              />
            </SurfacePanel>

            <aside className="space-y-4">
              <InfoCard
                icon={ShieldCheck}
                title={`${approvedCount} règle${approvedCount !== 1 ? 's' : ''} validée${approvedCount !== 1 ? 's' : ''}`}
                description={
                  pendingCount > 0
                    ? `${pendingCount} en attente d’approbation.`
                    : 'Votre charte est à jour.'
                }
              />
            </aside>
          </div>
        </div>
      </AppPage>

      <BottomNav active="rules" />
    </div>
  );
}
