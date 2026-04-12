import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { ProposeRuleDialog } from '@/components/custom/propose-rule-dialog';
import { RuleList, type Rule } from '@/components/custom/rule-list';
import { BottomNav } from '@/components/custom/bottom-nav';

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
      <div className="mx-auto max-w-6xl px-4 py-8 pb-40 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="surface-panel rounded-[2.2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Charte du couple</p>
                <h1 className="mt-2 text-3xl font-bold italic tracking-tight text-[#ecddfb] sm:text-4xl">
                  Règlements
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d7c0d1]">
                  Proposez des règles de vie à deux. Chaque règle doit être
                  approuvée par les deux partenaires pour devenir officielle.
                </p>
              </div>
              <ProposeRuleDialog />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
              <RuleList
                rules={typedRules}
                userId={user.id}
                partnerName={partner?.display_name ?? null}
              />
            </section>

            <aside className="space-y-4">
              <div className="surface-panel rounded-[1.9rem] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffadf9]/12 text-[#ffadf9]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[#f5e9ff]">
                      {approvedCount}
                    </p>
                    <p className="text-sm text-[#baa6cd]">
                      règle{approvedCount !== 1 ? 's' : ''} validée{approvedCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {pendingCount > 0 && (
                  <p className="mt-3 text-sm text-amber-200/80">
                    {pendingCount} en attente d&apos;approbation
                  </p>
                )}
              </div>

              <div className="surface-panel rounded-[1.9rem] p-5">
                <p className="text-lg font-semibold text-[#f5e9ff]">
                  Comment ça marche
                </p>
                <ol className="mt-3 space-y-2 text-sm leading-7 text-[#baa6cd]">
                  <li>
                    <span className="font-medium text-[#f0e3fb]">1.</span> L&apos;un
                    de vous propose une règle
                  </li>
                  <li>
                    <span className="font-medium text-[#f0e3fb]">2.</span> L&apos;autre
                    approuve ou refuse
                  </li>
                  <li>
                    <span className="font-medium text-[#f0e3fb]">3.</span> La règle
                    approuvée entre dans votre charte
                  </li>
                </ol>
              </div>

              <div className="surface-panel-soft rounded-[1.9rem] p-5">
                <div className="flex items-center gap-2 text-[#ffbdf8]">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-semibold">Astuce</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#baa6cd]">
                  Commencez par des règles simples et positives. Une bonne règle
                  décrit ce que vous voulez construire ensemble, pas ce que vous
                  voulez éviter.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BottomNav active="rules" />
    </div>
  );
}
