import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QUESTIONS } from '@/lib/questions';
import {
  QuestionsCarousel,
  type CustomQuestion,
} from '@/components/custom/questions-carousel';
import { BottomNav } from '@/components/custom/bottom-nav';
import { AppPage } from '@/components/custom/page-shell';

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

  const { data: partner } = await supabase
    .from('couple_members')
    .select('display_name')
    .eq('couple_id', coupleMember.couple_id)
    .neq('user_id', user.id)
    .single();

  const [progressResult, customQuestionsResult] = await Promise.all([
    supabase
      .from('questions_progress')
      .select('question_index, custom_question_id, completed_by, completed_at')
      .eq('couple_id', coupleMember.couple_id)
      .order('completed_at', { ascending: false }),
    supabase
      .from('custom_questions')
      .select('id, text, created_by, created_at')
      .eq('couple_id', coupleMember.couple_id)
      .order('created_at', { ascending: true }),
  ]);

  const progress = progressResult.data ?? [];
  const customQuestions: CustomQuestion[] = (customQuestionsResult.data ?? []).map(
    (q) => ({
      id: q.id,
      text: q.text,
      createdBy: q.created_by,
    })
  );

  const completedBuiltinIndices = progress
    .filter((p) => p.question_index != null)
    .map((p) => p.question_index as number);
  const completedCustomIds = progress
    .filter((p) => p.custom_question_id != null)
    .map((p) => p.custom_question_id as string);

  const lastCompletedBy = progress[0]?.completed_by ?? null;
  const hasPartner = !!partner;

  return (
    <div className="min-h-screen">
      <AppPage className="max-w-3xl gap-4 pt-4">
        <QuestionsCarousel
          coupleId={coupleMember.couple_id}
          userId={user.id}
          displayName={coupleMember.display_name}
          partnerName={partner?.display_name ?? null}
          hasPartner={hasPartner}
          builtinQuestions={QUESTIONS}
          initialCustomQuestions={customQuestions}
          completedBuiltinIndices={completedBuiltinIndices}
          completedCustomIds={completedCustomIds}
          lastCompletedBy={lastCompletedBy}
        />
      </AppPage>

      <BottomNav active="questions" />
    </div>
  );
}
