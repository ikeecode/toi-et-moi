'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  addCustomQuestion,
  deleteCustomQuestion,
  markBuiltinQuestionCompleted,
  markCustomQuestionCompleted,
} from '@/app/questions/actions';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/questions';

export interface CustomQuestion {
  id: string;
  text: string;
  createdBy: string;
}

interface QuestionsCarouselProps {
  coupleId: string;
  userId: string;
  displayName: string;
  partnerName: string | null;
  hasPartner: boolean;
  builtinQuestions: Question[];
  initialCustomQuestions: CustomQuestion[];
  completedBuiltinIndices: number[];
  completedCustomIds: string[];
  lastCompletedBy: string | null;
}

type DisplayQuestion =
  | {
      key: string;
      kind: 'builtin';
      set: 1 | 2 | 3;
      text: string;
      builtinIndex: number;
    }
  | {
      key: string;
      kind: 'custom';
      set: 4;
      text: string;
      customId: string;
      createdBy: string;
    };

const builtinKey = (i: number) => `builtin:${i}`;
const customKey = (id: string) => `custom:${id}`;
const SWIPE_THRESHOLD = 80;

export function QuestionsCarousel({
  coupleId,
  userId,
  displayName,
  partnerName,
  hasPartner,
  builtinQuestions,
  initialCustomQuestions,
  completedBuiltinIndices,
  completedCustomIds,
  lastCompletedBy: initialLastCompletedBy,
}: QuestionsCarouselProps) {
  const [partnerPresent, setPartnerPresent] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(
    initialCustomQuestions
  );
  const [completedSet, setCompletedSet] = useState<Set<string>>(
    () =>
      new Set<string>([
        ...completedBuiltinIndices.map(builtinKey),
        ...completedCustomIds.map(customKey),
      ])
  );
  const [lastMarkedBy, setLastMarkedBy] = useState<string | null>(
    initialLastCompletedBy
  );
  const [direction, setDirection] = useState(0);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isAddPending, startAddTransition] = useTransition();

  const channelRef = useRef<
    ReturnType<ReturnType<typeof createClient>['channel']> | null
  >(null);
  const partnerWasPresent = useRef(false);

  const questions = useMemo<DisplayQuestion[]>(() => {
    const builtin: DisplayQuestion[] = builtinQuestions.map((q) => ({
      key: builtinKey(q.index),
      kind: 'builtin',
      set: q.set,
      text: q.text,
      builtinIndex: q.index,
    }));

    const custom: DisplayQuestion[] = customQuestions.map((q) => ({
      key: customKey(q.id),
      kind: 'custom',
      set: 4,
      text: q.text,
      customId: q.id,
      createdBy: q.createdBy,
    }));

    return [...builtin, ...custom];
  }, [builtinQuestions, customQuestions]);

  const [currentPosition, setCurrentPosition] = useState(() => {
    const initiallyCompleted = new Set<string>([
      ...completedBuiltinIndices.map(builtinKey),
      ...completedCustomIds.map(customKey),
    ]);

    const builtinIndex = builtinQuestions.findIndex(
      (question) => !initiallyCompleted.has(builtinKey(question.index))
    );

    if (builtinIndex !== -1) {
      return builtinIndex;
    }

    const customIndex = initialCustomQuestions.findIndex(
      (question) => !initiallyCompleted.has(customKey(question.id))
    );

    if (customIndex !== -1) {
      return builtinQuestions.length + customIndex;
    }

    return 0;
  });

  useEffect(() => {
    if (!hasPartner) return;

    const supabase = createClient();
    const channel = supabase.channel(`questions:${coupleId}`);
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat() as unknown as Array<{
        user_id: string;
      }>;
      const otherPresent = users.some((user) => user.user_id !== userId);

      if (otherPresent) {
        setPartnerPresent(true);
        setPartnerLeft(false);
        partnerWasPresent.current = true;
      } else if (partnerWasPresent.current) {
        setPartnerPresent(false);
        setPartnerLeft(true);
        toast.info('Votre partenaire est hors ligne.');
      } else {
        setPartnerPresent(false);
      }
    });

    channel.on('broadcast', { event: 'navigate' }, ({ payload }) => {
      if (payload && typeof payload.position === 'number') {
        setCurrentPosition((previousPosition) => {
          setDirection(payload.position > previousPosition ? 1 : -1);
          return payload.position;
        });
      }
    });

    channel.on('broadcast', { event: 'completed' }, ({ payload }) => {
      if (payload && typeof payload.key === 'string' && typeof payload.by === 'string') {
        setCompletedSet((previous) => new Set([...previous, payload.key]));
        setLastMarkedBy(payload.by);
      }
    });

    channel.on('broadcast', { event: 'custom:added' }, ({ payload }) => {
      if (
        payload &&
        typeof payload.id === 'string' &&
        typeof payload.text === 'string' &&
        typeof payload.createdBy === 'string'
      ) {
        setCustomQuestions((prev) =>
          prev.some((question) => question.id === payload.id)
            ? prev
            : [
                ...prev,
                {
                  id: payload.id,
                  text: payload.text,
                  createdBy: payload.createdBy,
                },
              ]
        );
      }
    });

    channel.on('broadcast', { event: 'custom:deleted' }, ({ payload }) => {
      if (payload && typeof payload.id === 'string') {
        setCustomQuestions((prev) => prev.filter((question) => question.id !== payload.id));
        setCompletedSet((prev) => {
          const next = new Set(prev);
          next.delete(customKey(payload.id));
          return next;
        });
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: userId, name: displayName });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [coupleId, displayName, hasPartner, userId]);

  const showingCustomComposer =
    currentPosition === questions.length && customQuestions.length === 0;
  const safePosition = Math.min(currentPosition, Math.max(0, questions.length - 1));
  const currentQuestion = showingCustomComposer ? undefined : questions[safePosition];
  const isCompleted = currentQuestion ? completedSet.has(currentQuestion.key) : false;
  const isMyTurn = lastMarkedBy === null || lastMarkedBy !== userId;
  const effectivePartnerPresent = hasPartner && partnerPresent;
  const effectivePartnerLeft = hasPartner && partnerLeft;
  const canComplete =
    !!currentQuestion && !isCompleted && effectivePartnerPresent && isMyTurn;
  const isOnCustomSet = currentQuestion?.set === 4 || showingCustomComposer;
  const progressPercent =
    questions.length === 0
      ? 0
      : Math.round((completedSet.size / questions.length) * 100);

  const statusLabel = !hasPartner
    ? 'Invitation'
    : effectivePartnerPresent
      ? isMyTurn
        ? 'À vous'
        : `Tour de ${partnerName ?? '...'}` 
      : effectivePartnerLeft
        ? 'Hors ligne'
        : 'En attente';

  const questionVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 48 : -48,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -48 : 48,
      opacity: 0,
      scale: 0.985,
    }),
  };

  const goTo = useCallback(
    (newPosition: number) => {
      if (newPosition < 0 || newPosition >= questions.length) return;

      setDirection(newPosition > currentPosition ? 1 : -1);
      setCurrentPosition(newPosition);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'navigate',
        payload: { position: newPosition },
      });
    },
    [currentPosition, questions.length]
  );

  function openCustomComposer() {
    setDirection(1);
    setCurrentPosition(questions.length);
  }

  function handleSwipeEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (showingCustomComposer) return;
    if (info.offset.x <= -SWIPE_THRESHOLD) {
      goTo(safePosition + 1);
    } else if (info.offset.x >= SWIPE_THRESHOLD) {
      goTo(safePosition - 1);
    }
  }

  function handleMarkCompleted() {
    if (!currentQuestion || !canComplete) return;

    const key = currentQuestion.key;

    setCompletedSet((previous) => new Set([...previous, key]));
    setLastMarkedBy(userId);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'completed',
      payload: { key, by: userId },
    });

    const promise =
      currentQuestion.kind === 'builtin'
        ? markBuiltinQuestionCompleted(currentQuestion.builtinIndex)
        : markCustomQuestionCompleted(currentQuestion.customId);

    promise.catch(() => {
      setCompletedSet((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      setLastMarkedBy(initialLastCompletedBy);
      toast.error("Impossible d'enregistrer cette question.");
    });
  }

  function handleAddCustomQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newQuestionText.trim();
    if (text.length < 3) {
      toast.error('La question est trop courte.');
      return;
    }

    startAddTransition(async () => {
      try {
        const created = await addCustomQuestion(text);
        const createdQuestion: CustomQuestion = {
          id: created.id,
          text: created.text,
          createdBy: created.created_by,
        };

        setCustomQuestions((prev) =>
          prev.some((question) => question.id === createdQuestion.id)
            ? prev
            : [...prev, createdQuestion]
        );
        setNewQuestionText('');
        setDirection(1);
        setCurrentPosition(questions.length);

        channelRef.current?.send({
          type: 'broadcast',
          event: 'custom:added',
          payload: createdQuestion,
        });

        toast.success('Question ajoutée.');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Impossible d'ajouter la question."
        );
      }
    });
  }

  function handleDeleteCustom(id: string) {
    const previous = customQuestions;
    const nextWillBeEmpty = customQuestions.length === 1;

    setCustomQuestions((prev) => prev.filter((question) => question.id !== id));
    setCompletedSet((prev) => {
      const next = new Set(prev);
      next.delete(customKey(id));
      return next;
    });
    setCurrentPosition((prev) =>
      nextWillBeEmpty ? questions.length - 1 : Math.min(prev, questions.length - 2)
    );

    channelRef.current?.send({
      type: 'broadcast',
      event: 'custom:deleted',
      payload: { id },
    });

    deleteCustomQuestion(id).catch(() => {
      setCustomQuestions(previous);
      toast.error('Impossible de supprimer la question.');
    });
  }

  const setLabels: Record<1 | 2 | 3 | 4, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: '+',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-[1rem] border border-white/10 bg-white/[0.03] p-1">
          {[1, 2, 3, 4].map((set) => (
            <button
              key={set}
              type="button"
              onClick={() => {
                const firstInSet = questions.findIndex((question) => question.set === set);

                if (firstInSet !== -1) {
                  goTo(firstInSet);
                  return;
                }

                if (set === 4) {
                  openCustomComposer();
                }
              }}
              className={cn(
                'flex h-9 min-w-11 items-center justify-center rounded-[0.8rem] px-3 text-sm font-semibold transition-colors',
                (currentQuestion?.set === set && !showingCustomComposer) ||
                  (set === 4 && showingCustomComposer)
                  ? 'bg-white text-[#0b0d12]'
                  : 'text-muted-foreground'
              )}
            >
              {setLabels[set as 1 | 2 | 3 | 4]}
            </button>
          ))}
        </div>

        <span
          className={cn(
            'soft-chip min-w-[5.6rem] justify-center',
            effectivePartnerPresent && isMyTurn && 'text-[#dbe7ff]',
            !hasPartner && 'text-amber-100',
            !effectivePartnerPresent && hasPartner && 'text-muted-foreground'
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedSet.size}/{questions.length || 0}
          </span>
          <span>
            {showingCustomComposer
              ? 'Vos questions'
              : questions.length === 0
                ? '0'
                : `${safePosition + 1}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#a7bfff,#7ea0ff)]"
            style={{ width: `${Math.max(progressPercent, questions.length ? 5 : 0)}%` }}
          />
        </div>
      </div>

      {isOnCustomSet ? (
        <form
          onSubmit={handleAddCustomQuestion}
          className="flex items-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-2"
        >
          <input
            type="text"
            value={newQuestionText}
            onChange={(event) => setNewQuestionText(event.target.value)}
            placeholder="Ajouter une question"
            maxLength={500}
            className="h-11 flex-1 rounded-[0.95rem] bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={isAddPending || newQuestionText.trim().length < 3}
            className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[#8fb2ff] text-[#09111f] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Ajouter la question</span>
          </button>
        </form>
      ) : null}

      <div className="relative min-h-[62svh]">
        <AnimatePresence mode="wait" custom={direction}>
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.key}
              custom={direction}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              onDragEnd={handleSwipeEnd}
              style={{ touchAction: 'pan-y' }}
              className="absolute inset-0"
            >
              <div className="surface-panel flex h-full flex-col rounded-[2rem] px-6 py-5 sm:px-8 sm:py-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="soft-chip">{setLabels[currentQuestion.set]}</span>
                  {currentQuestion.kind === 'custom' ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(currentQuestion.customId)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:border-red-300/40 hover:text-red-200"
                      aria-label="Supprimer cette question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="max-w-2xl text-center text-[1.95rem] font-semibold leading-[1.22] tracking-tight text-foreground sm:text-[2.55rem]">
                    {currentQuestion.text}
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  {isCompleted ? (
                    <span className="soft-chip border-[#8fb2ff]/20 bg-[#8fb2ff]/12 text-[#dbe7ff]">
                      <Check className="h-4 w-4" />
                      Discutée
                    </span>
                  ) : canComplete ? (
                    <button
                      type="button"
                      onClick={handleMarkCompleted}
                      className="cta-primary h-12 px-6"
                    >
                      Marquer
                    </button>
                  ) : !hasPartner ? (
                    <Link href="/invite" className="cta-secondary">
                      Inviter
                    </Link>
                  ) : (
                    <span className="soft-chip">
                      {effectivePartnerPresent
                        ? `Tour de ${partnerName ?? '...'}`
                        : 'Disponible hors ligne'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="custom-composer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="surface-panel flex h-full flex-col items-center justify-center rounded-[2rem] px-6 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                  <Plus className="h-5 w-5 text-foreground" />
                </div>
                <p className="mt-5 text-xl font-semibold text-foreground">
                  Vos questions
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ajoutez-en une puis glissez pour continuer.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(safePosition - 1)}
          disabled={safePosition === 0 || questions.length === 0 || showingCustomComposer}
          className="cta-secondary h-11 w-11 rounded-full px-0 disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Question précédente</span>
        </button>

        <span className="soft-chip min-w-[5.6rem] justify-center text-[0.78rem]">
          {showingCustomComposer
            ? 'Ajouter'
            : questions.length === 0
              ? '0 / 0'
              : `${safePosition + 1} / ${questions.length}`}
        </span>

        <button
          type="button"
          onClick={() => goTo(safePosition + 1)}
          disabled={
            safePosition >= questions.length - 1 ||
            questions.length === 0 ||
            showingCustomComposer
          }
          className="cta-secondary h-11 w-11 rounded-full px-0 disabled:opacity-35"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Question suivante</span>
        </button>
      </div>
    </div>
  );
}
