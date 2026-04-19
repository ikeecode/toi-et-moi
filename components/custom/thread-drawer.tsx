'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Undo2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Conversation } from '@/components/custom/conversation/conversation';
import {
  markTopicDiscussed,
  unmarkTopicDiscussed,
} from '@/app/questions/topics-actions';
import { createClient } from '@/lib/supabase/client';
import type { MessageRow, ThreadTopicRow } from '@/lib/conversations/types';

interface ThreadDrawerProps {
  open: boolean;
  onClose: () => void;
  topic: ThreadTopicRow | null;
  questionText: string;
  setNumber: 1 | 2 | 3 | 4;
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  authorNameById: Record<string, string>;
}

const setLabel: Record<1 | 2 | 3 | 4, string> = { 1: 'I', 2: 'II', 3: 'III', 4: '+' };

export function ThreadDrawer({
  open,
  onClose,
  topic,
  questionText,
  setNumber,
  coupleId,
  currentUserId,
  otherUserId,
  authorNameById,
}: ThreadDrawerProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reads, setReads] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !topic) return;
    setLoaded(false);
    const supabase = createClient();
    (async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('context_type', 'thread')
        .eq('context_id', topic.id)
        .order('created_at', { ascending: true });
      const list = (msgs ?? []) as MessageRow[];
      setMessages(list);

      if (list.length > 0) {
        const { data: readsData } = await supabase
          .from('message_reads')
          .select('*')
          .in('message_id', list.map((m) => m.id));
        const map: Record<string, string[]> = {};
        for (const row of readsData ?? []) {
          const entry = row as { message_id: string; user_id: string };
          (map[entry.message_id] ??= []).push(entry.user_id);
        }
        setReads(map);
      } else {
        setReads({});
      }
      setLoaded(true);
    })();
  }, [open, topic, coupleId]);

  if (!topic) return null;

  const isDiscussed = topic.discussed_at !== null;

  function handleMark() {
    startTransition(async () => {
      try {
        await markTopicDiscussed(topic!.id);
        toast.success('Marquée discutée.', {
          action: {
            label: 'Annuler',
            onClick: () => {
              unmarkTopicDiscussed(topic!.id).catch(() => undefined);
            },
          },
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Échec.');
      }
    });
  }

  function handleUnmark() {
    startTransition(async () => {
      await unmarkTopicDiscussed(topic!.id);
      toast.success('Discussion rouverte.');
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0b0d12]"
        >
          <header className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="accent-chip">{setLabel[setNumber]}</span>
            <div className="w-10" />
          </header>

          <div className="px-5 pb-2">
            <p className="text-base font-semibold leading-snug text-foreground">
              {questionText}
            </p>
          </div>

          <div className="flex-1 min-h-0 px-4 pb-4">
            {loaded && (
              <Conversation
                coupleId={coupleId}
                currentUserId={currentUserId}
                otherUserId={otherUserId}
                contextType="thread"
                contextId={topic.id}
                initialMessages={messages}
                initialReads={reads}
                authorNameById={authorNameById}
                placeholder="Écrire…"
              />
            )}
          </div>

          <div className="px-4 pb-4">
            {isDiscussed ? (
              <button
                type="button"
                onClick={handleUnmark}
                disabled={isPending}
                className="cta-secondary h-11 w-full"
              >
                <Undo2 className="h-4 w-4" /> Rouvrir la discussion
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMark}
                disabled={isPending}
                className="cta-primary h-11 w-full"
              >
                <Check className="h-4 w-4" /> Marquer comme discutée
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
