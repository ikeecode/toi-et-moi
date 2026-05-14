'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { SystemEvent } from './system-event';
import type { MessageRow, OptimisticMessage } from '@/lib/conversations/types';

interface MessageListProps {
  messages: (MessageRow | OptimisticMessage)[];
  currentUserId: string;
  otherUserId: string | null;
  reads: Record<string, Set<string>>;
  authorNameById: Record<string, string>;
}

export function MessageList({
  messages,
  currentUserId,
  otherUserId,
  reads,
  authorNameById,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col px-1 py-2">
      {messages.map((message, index) => {
        if (message.kind === 'system') {
          return (
            <SystemEvent
              key={message.id}
              message={message as MessageRow}
              authorName={authorNameById[message.author_id ?? ''] ?? 'Quelqu’un'}
            />
          );
        }

        const prev = messages[index - 1];
        const next = messages[index + 1];
        const isGroupStart =
          !prev || prev.author_id !== message.author_id || prev.kind === 'system';
        const isGroupEnd =
          !next || next.author_id !== message.author_id || next.kind === 'system';
        const isOwn = message.author_id === currentUserId;
        const readByOther =
          isOwn && otherUserId ? reads[message.id]?.has(otherUserId) ?? false : false;
        const status = (message as OptimisticMessage).status;

        return (
          <MessageBubble
            key={message.id}
            message={message as MessageRow}
            isOwn={isOwn}
            isGroupStart={isGroupStart}
            isGroupEnd={isGroupEnd}
            readByOther={readByOther}
            status={status}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
