import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MemoryDetailView } from '@/components/custom/memory-detail-view';
import { BottomNav } from '@/components/custom/bottom-nav';
import type { MessageRow } from '@/lib/conversations/types';

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: memory } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .eq('couple_id', member.couple_id)
    .single();
  if (!memory) notFound();

  const { data: photos } = await supabase
    .from('memory_photos')
    .select('*')
    .eq('memory_id', id)
    .order('created_at', { ascending: true });

  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('couple_id', member.couple_id)
    .eq('context_type', 'memory')
    .eq('context_id', id)
    .order('created_at', { ascending: true });

  const messages: MessageRow[] = (messagesData ?? []) as MessageRow[];

  const messageIds = messages.map((m) => m.id);
  const { data: readsData } = messageIds.length
    ? await supabase.from('message_reads').select('*').in('message_id', messageIds)
    : { data: [] };

  const initialReads: Record<string, string[]> = {};
  for (const row of readsData ?? []) {
    const entry = row as { message_id: string; user_id: string };
    (initialReads[entry.message_id] ??= []).push(entry.user_id);
  }

  const { data: members } = await supabase
    .from('couple_members')
    .select('user_id, display_name, nickname')
    .eq('couple_id', member.couple_id);

  const authorNameById: Record<string, string> = {};
  for (const m of members ?? []) {
    authorNameById[m.user_id] =
      m.nickname || m.display_name || 'Toi & Moi';
  }

  const otherUserId =
    members?.find((m) => m.user_id !== user.id)?.user_id ?? null;

  return (
    <div className="min-h-screen">
      <MemoryDetailView
        memory={memory}
        photos={photos ?? []}
        coupleId={member.couple_id}
        currentUserId={user.id}
        otherUserId={otherUserId}
        initialMessages={messages}
        initialReads={initialReads}
        authorNameById={authorNameById}
      />
      <BottomNav active="memories" />
    </div>
  );
}
