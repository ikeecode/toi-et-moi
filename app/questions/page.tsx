import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { QUESTIONS } from '@/lib/questions';
import { QuestionsCarousel } from '@/components/custom/questions-carousel';
import { BottomNav } from '@/components/custom/bottom-nav';

export default async function QuestionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id, display_name')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    redirect('/setup');
  }

  // Fetch partner info
  const { data: partner } = await supabase
    .from('couple_members')
    .select('display_name')
    .eq('couple_id', coupleMember.couple_id)
    .neq('user_id', user.id)
    .single();

  const { data: progress } = await supabase
    .from('questions_progress')
    .select('question_index, completed_by')
    .eq('couple_id', coupleMember.couple_id)
    .order('completed_at', { ascending: false });

  const completedIndices = (progress ?? []).map((p) => p.question_index);
  const lastCompletedBy = progress?.[0]?.completed_by ?? null;
  const hasPartner = !!partner;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 pb-40 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-white/8 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(7,3,13,0.22)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Rituel relationnel</p>
              <h1 className="mt-2 text-3xl font-bold italic tracking-tight text-[#ecddfb] sm:text-4xl">
                36 Questions
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d7c0d1]">
                Une expérience pensée pour nourrir la conversation au lieu de la
                bloquer. Vous pouvez préparer la prochaine discussion même si
                votre partenaire n&apos;est pas connecté au même moment.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffadf9]/16 bg-[#ffadf9]/10 px-4 py-2 text-sm font-medium text-[#ffc7fb]">
              <Sparkles className="h-4 w-4" />
              {completedIndices.length} / 36 complétées
            </div>
          </div>
        </div>

        <div>
          <h2 className="sr-only">
            36 Questions
          </h2>
        </div>

        <QuestionsCarousel
          coupleId={coupleMember.couple_id}
          userId={user.id}
          displayName={coupleMember.display_name}
          partnerName={partner?.display_name ?? null}
          hasPartner={hasPartner}
          questions={QUESTIONS}
          completedIndices={completedIndices}
          lastCompletedBy={lastCompletedBy}
        />
      </div>

      <BottomNav active="questions" />
    </div>
  );
}
