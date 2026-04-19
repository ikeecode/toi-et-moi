import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/custom/bottom-nav';
import { QuestionsChat } from '@/components/custom/questions-chat';
import { backfillTopicsFromProgress } from '@/app/questions/topics-actions';
import type { MessageRow, ThreadTopicRow } from '@/lib/conversations/types';

export default async function QuestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();
  if (!member) redirect('/setup');

  await backfillTopicsFromProgress();

  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('couple_id', member.couple_id)
    .eq('context_type', 'main')
    .order('created_at', { ascending: true });
  const messages = (messagesData ?? []) as MessageRow[];

  const messageIds = messages.map((m) => m.id);
  const { data: readsData } = messageIds.length
    ? await supabase.from('message_reads').select('*').in('message_id', messageIds)
    : { data: [] };
  const initialReads: Record<string, string[]> = {};
  for (const row of readsData ?? []) {
    const entry = row as { message_id: string; user_id: string };
    (initialReads[entry.message_id] ??= []).push(entry.user_id);
  }

  const { data: topics } = await supabase
    .from('thread_topics')
    .select('*')
    .eq('couple_id', member.couple_id);

  const { data: customQuestions } = await supabase
    .from('custom_questions')
    .select('id, text')
    .eq('couple_id', member.couple_id);

  const { data: members } = await supabase
    .from('couple_members')
    .select('user_id, display_name, nickname')
    .eq('couple_id', member.couple_id);

  const authorNameById: Record<string, string> = {};
  for (const m of members ?? []) {
    authorNameById[m.user_id] = m.nickname || m.display_name || 'Toi & Moi';
  }

  const otherUserId = members?.find((m) => m.user_id !== user.id)?.user_id ?? null;

  return (
    <div className="min-h-screen">
      <QuestionsChat
        coupleId={member.couple_id}
        currentUserId={user.id}
        otherUserId={otherUserId}
        authorNameById={authorNameById}
        initialMessages={messages}
        initialReads={initialReads}
        topics={(topics ?? []) as ThreadTopicRow[]}
        customQuestions={customQuestions ?? []}
      />
      <BottomNav active="questions" />
    </div>
  );
}
