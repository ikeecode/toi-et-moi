'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MessageRow, MemoryDiff } from '@/lib/conversations/types';

interface SystemEventProps {
  message: MessageRow;
  currentUserId: string;
  authorName: string;
  onOpenTopicThread?: (topicId: string) => void;
  onMarkTopicDiscussed?: (topicId: string) => void;
}

export function SystemEvent({
  message,
  currentUserId,
  authorName,
  onOpenTopicThread,
  onMarkTopicDiscussed,
}: SystemEventProps) {
  const meta = message.metadata as { event?: string } & Record<string, unknown>;

  if (meta.event === 'memory.created') {
    return (
      <SystemLine>
        <span>Souvenir créé {formatRel(message.created_at)}</span>
      </SystemLine>
    );
  }

  if (meta.event === 'memory.edited') {
    const diff = (meta as { diff: MemoryDiff }).diff;
    return <EditedEvent message={message} diff={diff} authorName={authorName} />;
  }

  if (meta.event === 'topic.pushed') {
    return (
      <TopicPushedCard
        message={message}
        currentUserId={currentUserId}
        authorName={authorName}
        onOpen={onOpenTopicThread}
        onMark={onMarkTopicDiscussed}
      />
    );
  }

  if (meta.event === 'topic.discussed') {
    return (
      <SystemLine>
        <span>Question marquée discutée {formatRel(message.created_at)}</span>
      </SystemLine>
    );
  }

  if (meta.event === 'topic.undiscussed') {
    return (
      <SystemLine>
        <span>Réouverture de la discussion {formatRel(message.created_at)}</span>
      </SystemLine>
    );
  }

  return null;
}

function SystemLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
        {children}
      </span>
    </div>
  );
}

function formatRel(iso: string) {
  return formatDistanceToNow(new Date(iso), { locale: fr, addSuffix: true });
}

function EditedEvent({
  message,
  diff,
  authorName,
}: {
  message: MessageRow;
  diff: MemoryDiff;
  authorName: string;
}) {
  const [open, setOpen] = useState(false);
  const hasAny =
    diff.title || diff.description || diff.date || diff.photosAdded || diff.photosRemoved;

  if (!hasAny) return null;

  return (
    <div className="my-3 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="soft-chip text-[0.72rem]"
      >
        {authorName} a modifié ce souvenir · {formatRel(message.created_at)}
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && (
        <div className="surface-panel-soft w-full max-w-md space-y-2 rounded-[1.25rem] px-4 py-3 text-xs">
          {diff.title && (
            <DiffRow label="Titre" from={diff.title.from} to={diff.title.to} />
          )}
          {diff.description && (
            <DiffRow
              label="Description"
              from={diff.description.from ?? '(vide)'}
              to={diff.description.to ?? '(vide)'}
            />
          )}
          {diff.date && (
            <DiffRow label="Date" from={diff.date.from} to={diff.date.to} />
          )}
          {diff.photosAdded && (
            <p className="text-muted-foreground">+{diff.photosAdded} photo(s)</p>
          )}
          {diff.photosRemoved && (
            <p className="text-muted-foreground">−{diff.photosRemoved} photo(s)</p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffRow({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div>
      <p className="section-kicker">{label}</p>
      <p className="mt-1 text-muted-foreground line-through">{from}</p>
      <p className="text-foreground">{to}</p>
    </div>
  );
}

function TopicPushedCard({
  message,
  currentUserId,
  authorName,
  onOpen,
  onMark,
}: {
  message: MessageRow;
  currentUserId: string;
  authorName: string;
  onOpen?: (topicId: string) => void;
  onMark?: (topicId: string) => void;
}) {
  const meta = message.metadata as {
    topicId: string;
    questionText: string;
    setNumber: 1 | 2 | 3 | 4;
  };
  const setLabel: Record<1 | 2 | 3 | 4, string> = { 1: 'I', 2: 'II', 3: 'III', 4: '+' };

  return (
    <div
      className={cn(
        'my-3 mx-auto w-full max-w-md rounded-[1.4rem] border border-white/10',
        'bg-[linear-gradient(180deg,rgba(143,178,255,0.08),rgba(143,178,255,0.02))] p-4'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="accent-chip">{setLabel[meta.setNumber]}</span>
        <span className="text-[0.65rem] text-muted-foreground">
          {authorName} · {formatRel(message.created_at)}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-foreground">
        {meta.questionText}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(meta.topicId)}
          className="cta-primary h-10 flex-1 px-4 text-[0.82rem]"
        >
          Ouvrir la discussion
        </button>
      </div>
    </div>
  );
}
