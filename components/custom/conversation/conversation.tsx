'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { TypingIndicator } from './typing-indicator';
import { useConversationChannel } from './use-conversation-channel';
import {
  postMessage,
  markMessageRead,
} from '@/app/conversations/actions';
import type {
  ConversationContextType,
  MessageRow,
  OptimisticMessage,
} from '@/lib/conversations/types';

interface ConversationProps {
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  contextType: ConversationContextType;
  contextId: string | null;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>;
  authorNameById: Record<string, string>;
  composerSlot?: ReactNode;
  placeholder?: string;
}

export function Conversation(props: ConversationProps) {
  const { messages, reads, typingUsers, setMessages, broadcastTyping } =
    useConversationChannel({
      coupleId: props.coupleId,
      userId: props.currentUserId,
      contextType: props.contextType,
      contextId: props.contextId,
      initialMessages: props.initialMessages,
      initialReads: props.initialReads,
    });

  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);

  const combined = useMemo(() => {
    const list: (MessageRow | OptimisticMessage)[] = [...messages];
    for (const opt of optimistic) {
      if (!messages.some((m) => m.id === opt.id)) list.push(opt);
    }
    return list.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  }, [messages, optimistic]);

  const readTrackedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const message of messages) {
      if (
        message.author_id &&
        message.author_id !== props.currentUserId &&
        !readTrackedRef.current.has(message.id)
      ) {
        readTrackedRef.current.add(message.id);
        markMessageRead(message.id).catch(() => undefined);
      }
    }
  }, [messages, props.currentUserId]);

  const handleSend = useCallback(
    async (body: string) => {
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nowIso = new Date().toISOString();
      const optimisticMessage: OptimisticMessage = {
        id: tempId,
        couple_id: props.coupleId,
        context_type: props.contextType,
        context_id: props.contextId,
        author_id: props.currentUserId,
        kind: 'text',
        body,
        metadata: {},
        reply_to: null,
        created_at: nowIso,
        edited_at: null,
        status: 'sending',
      };
      setOptimistic((prev) => [...prev, optimisticMessage]);

      try {
        const inserted = await postMessage({
          contextType: props.contextType,
          contextId: props.contextId,
          body,
        });
        setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
        setMessages((prev) =>
          prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted as MessageRow]
        );
      } catch (error) {
        setOptimistic((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
        toast.error(error instanceof Error ? error.message : 'Échec d’envoi.');
      }
    },
    [props.coupleId, props.contextId, props.contextType, props.currentUserId, setMessages]
  );

  const someoneTyping = typingUsers.size > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={combined}
          currentUserId={props.currentUserId}
          otherUserId={props.otherUserId}
          reads={reads}
          authorNameById={props.authorNameById}
        />
        {someoneTyping && props.otherUserId && (
          <TypingIndicator
            name={props.authorNameById[props.otherUserId] ?? 'Partenaire'}
          />
        )}
      </div>
      <div className="pt-2">
        <Composer
          onSend={handleSend}
          onTyping={broadcastTyping}
          leftSlot={props.composerSlot}
          placeholder={props.placeholder}
        />
      </div>
    </div>
  );
}
