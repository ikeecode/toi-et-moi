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
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  addCustomQuestion,
  deleteCustomQuestion,
  markBuiltinQuestionCompleted,
  markCustomQuestionCompleted,
} from '@/app/questions/actions';
import { createClient } from '@/lib/supabase/client';
import { buttonVariants } from '@/components/ui/button';
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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

  // Sync completed state when server props change (e.g. after revalidatePath or page revisit)
  useEffect(() => {
    const serverSet = new Set<string>([
      ...completedBuiltinIndices.map(builtinKey),
      ...completedCustomIds.map(customKey),
    ]);
    setCompletedSet((prev) => {
      // Merge: keep anything the server knows about + anything added locally via Realtime
      const merged = new Set(prev);
      for (const key of serverSet) merged.add(key);
      if (merged.size !== prev.size) return merged;
      return prev;
    });
  }, [completedBuiltinIndices, completedCustomIds]);

  useEffect(() => {
    if (initialLastCompletedBy != null) {
      setLastMarkedBy(initialLastCompletedBy);
    }
  }, [initialLastCompletedBy]);
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

  const initialPosition = useMemo(() => {
    const next = questions.findIndex((q) => !completedSet.has(q.key));
    return next === -1 ? 0 : next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  const safePosition = Math.min(currentPosition, Math.max(0, questions.length - 1));
  const currentQuestion = questions[safePosition];
  const isCompleted = currentQuestion ? completedSet.has(currentQuestion.key) : false;
  const isMyTurn = lastMarkedBy === null || lastMarkedBy !== userId;
  const progressPercent =
    questions.length === 0
      ? 0
      : Math.round((completedSet.size / questions.length) * 100);

  const goTo = useCallback(
    (newPosition: number) => {
      if (newPosition < 0 || newPosition >= questions.length) return;
      setDirection((prev) => {
        void prev;
        return newPosition > currentPosition ? 1 : -1;
      });
      setCurrentPosition(newPosition);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'navigate',
        payload: { position: newPosition },
      });
    },
    [currentPosition, questions.length]
  );

  useEffect(() => {
    if (!hasPartner) {
      setPartnerPresent(false);
      setPartnerLeft(false);
      return;
    }

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
        toast.info('Votre partenaire s’est déconnecté(e)');
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
          prev.some((q) => q.id === payload.id)
            ? prev
            : [...prev, { id: payload.id, text: payload.text, createdBy: payload.createdBy }]
        );
      }
    });

    channel.on('broadcast', { event: 'custom:deleted' }, ({ payload }) => {
      if (payload && typeof payload.id === 'string') {
        setCustomQuestions((prev) => prev.filter((q) => q.id !== payload.id));
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

  function handleMarkCompleted() {
    if (!currentQuestion || !partnerPresent || !isMyTurn) return;

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
      toast.error('Erreur lors de l’enregistrement');
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
          prev.some((q) => q.id === createdQuestion.id) ? prev : [...prev, createdQuestion]
        );
        setNewQuestionText('');
        channelRef.current?.send({
          type: 'broadcast',
          event: 'custom:added',
          payload: createdQuestion,
        });
        toast.success('Question ajoutée');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible d’ajouter la question.'
        );
      }
    });
  }

  function handleDeleteCustom(id: string) {
    const previous = customQuestions;
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
    setCompletedSet((prev) => {
      const next = new Set(prev);
      next.delete(customKey(id));
      return next;
    });
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
    1: 'Série I',
    2: 'Série II',
    3: 'Série III',
    4: 'Vos questions',
  };

  const setDescriptions: Record<1 | 2 | 3 | 4, string> = {
    1: 'Briser la glace sans rester superficiel',
    2: 'Aller vers des réponses plus personnelles',
    3: 'Ouvrir les sujets qui demandent de la confiance',
    4: 'Les questions que vous avez envie de poser à deux',
  };

  const turnLabel = isMyTurn
    ? 'À vous de lancer la prochaine question'
    : `Au tour de ${partnerName ?? 'votre partenaire'}`;

  const connectionLabel = !hasPartner
    ? 'Invitez votre partenaire pour vivre le rituel à deux'
    : partnerPresent
      ? 'En direct, vous pouvez avancer ensemble'
      : partnerLeft
        ? 'Votre partenaire est hors ligne pour le moment'
        : 'Votre partenaire n’est pas connecté en ce moment';

  const questionVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.98,
    }),
  };

  const isOnCustomSet = currentQuestion?.set === 4;
  const hasCustomQuestions = customQuestions.length > 0;

  return (
    <div className="space-y-5">
      <div className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#180f24] bg-gradient-to-br from-[#ffadf9] to-[#ff77ff] text-sm font-bold text-[#37003a]">
                  {getInitials(displayName)}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#180f24] bg-gradient-to-br from-[#d4bbff] to-[#ffadf9] text-sm font-bold text-[#37003a]">
                  {partnerName ? getInitials(partnerName) : '?'}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#f4e8ff]">
                  {hasPartner
                    ? `${displayName} & ${partnerName ?? 'votre partenaire'}`
                    : 'Un rituel prêt à être partagé'}
                </p>
                <p className="mt-1 text-sm text-[#baa6cd]">{connectionLabel}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f0e3fb]">
              <Sparkles className="h-4 w-4 text-[#ffadf9]" />
              {turnLabel}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#f3e7ff]">
                {completedSet.size} question(s) complétée(s)
              </span>
              <span className="text-[#baa6cd]">{progressPercent}% du parcours</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff]"
                style={{ width: `${Math.max(progressPercent, 4)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {!partnerPresent && (
        <div className="surface-panel-soft rounded-[1.8rem] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#f4e8ff]">
                {hasPartner
                  ? 'Le rituel reste visible, même si vous ne répondez pas en même temps.'
                  : 'Invitez votre partenaire pour débloquer les validations à deux.'}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                {hasPartner
                  ? 'Vous pouvez déjà lire, préparer et parcourir les prochaines questions. La validation se fera une fois réunis.'
                  : 'Le parcours est prêt: partagez votre lien d’invitation depuis l’espace duo pour commencer ensemble.'}
              </p>
            </div>

            {!hasPartner && (
              <Link
                href="/invite"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-11 rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] px-5 text-sm font-bold text-[#37003a] hover:bg-transparent hover:text-[#37003a]'
                )}
              >
                <UserPlus className="h-4 w-4" />
                Inviter
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-full border border-white/10 bg-white/[0.04] p-1">
          {[1, 2, 3, 4].map((set) => (
            <button
              key={set}
              onClick={() => {
                const firstInSet = questions.findIndex((q) => q.set === set);
                if (firstInSet !== -1) {
                  goTo(firstInSet);
                } else if (set === 4) {
                  setDirection(1);
                  setCurrentPosition(questions.length);
                }
              }}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
                currentQuestion?.set === set ||
                  (set === 4 && !hasCustomQuestions && isOnCustomSet)
                  ? 'bg-[#ffadf9] text-[#37003a]'
                  : 'text-[#cdb8de] hover:text-[#fff0ff]'
              )}
            >
              {setLabels[set as 1 | 2 | 3 | 4]}
            </button>
          ))}
        </div>

        <p className="text-sm text-[#baa6cd]">
          {currentQuestion
            ? setDescriptions[currentQuestion.set]
            : setDescriptions[4]}
        </p>
      </div>

      {isOnCustomSet || !hasCustomQuestions ? (
        <form
          onSubmit={handleAddCustomQuestion}
          className="surface-panel-soft flex flex-col gap-3 rounded-[1.8rem] p-4 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            value={newQuestionText}
            onChange={(event) => setNewQuestionText(event.target.value)}
            placeholder="Ajoutez une question que vous voulez vous poser…"
            maxLength={500}
            className="flex-1 rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm text-[#f4e8ff] placeholder:text-[#8c7aa0] focus:border-[#ffadf9]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isAddPending || newQuestionText.trim().length < 3}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] px-5 text-sm font-bold text-[#37003a] shadow-[0_16px_40px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {isAddPending ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      ) : null}

      <div className="relative min-h-[24rem] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.key}
              custom={direction}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <div className="surface-panel flex h-full flex-col rounded-[2.2rem] p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-kicker">Question actuelle</p>
                    <p className="mt-2 text-sm font-medium text-[#f0e3fb]">
                      Question {safePosition + 1} sur {questions.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#e8d9f6]">
                      {setLabels[currentQuestion.set]}
                    </span>
                    {currentQuestion.kind === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(currentQuestion.customId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#e8d9f6] transition-colors hover:border-red-300/40 hover:text-red-200"
                        aria-label="Supprimer cette question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 items-center">
                  <p className="text-pretty text-2xl font-semibold leading-relaxed tracking-tight text-[#f8efff] sm:text-3xl">
                    {currentQuestion.text}
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  {isCompleted ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#ffadf9]/20 bg-[#ffadf9]/10 px-4 py-2 text-sm font-medium text-[#ffbdf8]">
                      <Check className="h-4 w-4" />
                      Question déjà discutée
                    </div>
                  ) : partnerPresent && isMyTurn ? (
                    <button
                      onClick={handleMarkCompleted}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ffadf9] via-[#f793ff] to-[#ff77ff] px-6 text-sm font-bold text-[#37003a] shadow-[0_16px_40px_rgba(255,119,255,0.22)] transition-all hover:-translate-y-0.5"
                    >
                      Marquer comme discutée
                    </button>
                  ) : (
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/10 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffadf9]/10 text-[#ffadf9]">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#f4e8ff]">
                            {partnerPresent
                              ? `Attendez la validation de ${partnerName ?? 'votre partenaire'}.`
                              : hasPartner
                                ? 'Gardez cette question pour votre prochain moment ensemble.'
                                : 'Invitez votre partenaire pour activer la validation à deux.'}
                          </p>
                          <p className="mt-1 text-sm leading-7 text-[#baa6cd]">
                            {partnerPresent
                              ? 'Le tour alterne pour garder la conversation équilibrée.'
                              : hasPartner
                                ? 'Vous pouvez déjà parcourir les cartes, mais la progression se valide lorsque vous êtes réunis.'
                                : 'Le reste du parcours prendra tout son sens dès que vous partagerez votre espace.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-custom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="surface-panel flex h-full flex-col items-center justify-center rounded-[2.2rem] p-8 text-center">
                <p className="section-kicker">Vos questions</p>
                <p className="mt-3 text-xl font-semibold text-[#f8efff]">
                  Ajoutez votre première question
                </p>
                <p className="mt-2 max-w-md text-sm leading-7 text-[#baa6cd]">
                  Utilisez le champ ci-dessus pour créer une question qui n&apos;existe
                  pas encore dans le rituel. Elle apparaîtra ici et comptera dans
                  votre progression.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => goTo(safePosition - 1)}
          disabled={safePosition === 0 || questions.length === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#f0e3fb] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Question précédente</span>
        </button>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#e7d8f5]">
          {questions.length === 0 ? '0 / 0' : `${safePosition + 1} / ${questions.length}`}
        </div>

        <button
          onClick={() => goTo(safePosition + 1)}
          disabled={safePosition >= questions.length - 1 || questions.length === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#f0e3fb] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Question suivante</span>
        </button>
      </div>
    </div>
  );
}
