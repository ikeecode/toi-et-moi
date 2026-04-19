'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextValue {
  channel: RealtimeChannel | null;
  coupleId: string;
  userId: string;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({
  coupleId,
  userId,
  children,
}: {
  coupleId: string;
  userId: string;
  children: ReactNode;
}) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`couple:${coupleId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        () => { /* handled by consumers via use-conversation-channel */ })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'thread_topics', filter: `couple_id=eq.${coupleId}` },
        () => {})
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        () => {})
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [coupleId, userId]);

  const value = useMemo(
    () => ({ channel: channelRef.current, coupleId, userId }),
    [coupleId, userId]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider');
  return ctx;
}
