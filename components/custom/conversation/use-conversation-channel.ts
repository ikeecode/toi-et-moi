'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MessageRow, ConversationContextType } from '@/lib/conversations/types';

interface UseConversationChannelArgs {
  coupleId: string;
  userId: string;
  contextType: ConversationContextType;
  contextId: string | null;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>; // messageId -> userIds
}

export function useConversationChannel(args: UseConversationChannelArgs) {
  const [messages, setMessages] = useState<MessageRow[]>(args.initialMessages);
  const [reads, setReads] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    for (const [mid, uids] of Object.entries(args.initialReads)) {
      map[mid] = new Set(uids);
    }
    return map;
  });
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      `couple:${args.coupleId}:${args.contextType}:${args.contextId ?? 'main'}`
    );

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${args.coupleId}`,
        },
        (payload: RealtimePostgresChangesPayload<MessageRow>) => {
          const row = payload.new as MessageRow;
          if (row.context_type !== args.contextType) return;
          if (args.contextType !== 'main' && row.context_id !== args.contextId) return;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string };
          setReads((prev) => {
            const next = { ...prev };
            const set = new Set(next[row.message_id] ?? []);
            set.add(row.user_id);
            next[row.message_id] = set;
            return next;
          });
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (
          payload &&
          payload.contextType === args.contextType &&
          payload.contextId === args.contextId &&
          payload.userId !== args.userId
        ) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.add(payload.userId);
            return next;
          });
          window.setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(payload.userId);
              return next;
            });
          }, 2500);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [args.coupleId, args.userId, args.contextType, args.contextId]);

  function broadcastTyping() {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        contextType: args.contextType,
        contextId: args.contextId,
        userId: args.userId,
      },
    });
  }

  return { messages, reads, typingUsers, setMessages, broadcastTyping };
}
