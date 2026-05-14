'use client';

import { useState, useTransition, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { QUESTIONS, type Question } from '@/lib/questions';
import { pushTopic } from '@/app/questions/topics-actions';
import { addCustomQuestion } from '@/app/questions/actions';

interface CustomQuestion {
  id: string;
  text: string;
}

interface PickQuestionDialogProps {
  customQuestions: CustomQuestion[];
  pushedBuiltinIndices: number[];
  pushedCustomIds: string[];
  trigger: ReactElement;
  onPushed?: () => void;
}

export function PickQuestionDialog({
  customQuestions,
  pushedBuiltinIndices,
  pushedCustomIds,
  trigger,
  onPushed,
}: PickQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<1 | 2 | 3 | 4>(1);
  const [search, setSearch] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const router = useRouter();

  const builtinFiltered: Question[] = QUESTIONS.filter((q) => q.set === tab).filter(
    (q) => q.text.toLowerCase().includes(search.toLowerCase())
  );
  const customFiltered = customQuestions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

  function handlePick(ref: { questionIndex?: number; customQuestionId?: string }) {
    startTransition(async () => {
      try {
        await pushTopic(ref);
        toast.success('Question ajoutée au fil.');
        setOpen(false);
        onPushed?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible de pousser la question.'
        );
      }
    });
  }

  function handleCreate() {
    const text = newQuestion.trim();
    if (text.length < 3) {
      toast.error('La question doit contenir au moins 3 caractères.');
      return;
    }
    startCreate(async () => {
      try {
        const created = await addCustomQuestion(text);
        setNewQuestion('');
        toast.success('Question créée.');
        router.refresh();
        await pushTopic({ customQuestionId: created.id });
        toast.success('Question ajoutée au fil.');
        setOpen(false);
        onPushed?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible de créer la question.'
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Piocher une question</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {([1, 2, 3, 4] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={cn(
                'flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                tab === s ? 'bg-white text-[#0b0d12]' : 'text-muted-foreground'
              )}
            >
              {s === 4 ? '+' : s === 1 ? 'I' : s === 2 ? 'II' : 'III'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher…"
            className="h-10 w-full rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm focus:outline-none"
          />
        </div>

        {tab === 4 && (
          <div className="flex flex-col gap-2 rounded-[1.1rem] border border-white/10 bg-white/[0.02] p-3">
            <label htmlFor="new-question" className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
              Créer une nouvelle question
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="new-question"
                type="text"
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="Écris ta question…"
                maxLength={500}
                disabled={isCreating}
                className="h-10 w-full min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleCreate();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating || newQuestion.trim().length < 3}
                className="cta-primary h-10 w-full shrink-0 px-4 text-[0.82rem] disabled:opacity-50 sm:w-auto"
              >
                {isCreating ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#09111f] border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Créer & envoyer
              </button>
            </div>
          </div>
        )}

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {tab !== 4 &&
            builtinFiltered.map((q) => {
              const pushed = pushedBuiltinIndices.includes(q.index);
              return (
                <button
                  key={q.index}
                  type="button"
                  disabled={pushed || isPending}
                  onClick={() => handlePick({ questionIndex: q.index })}
                  className={cn(
                    'block w-full rounded-[1.1rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm transition-colors',
                    pushed ? 'opacity-50' : 'hover:bg-white/[0.06]'
                  )}
                >
                  <span className="text-foreground">{q.text}</span>
                  {pushed && (
                    <span className="ml-2 text-xs text-muted-foreground">· déjà poussée</span>
                  )}
                </button>
              );
            })}
          {tab === 4 &&
            customFiltered.map((q) => {
              const pushed = pushedCustomIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={pushed || isPending}
                  onClick={() => handlePick({ customQuestionId: q.id })}
                  className={cn(
                    'block w-full rounded-[1.1rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm transition-colors',
                    pushed ? 'opacity-50' : 'hover:bg-white/[0.06]'
                  )}
                >
                  <span className="text-foreground">{q.text}</span>
                  {pushed && (
                    <span className="ml-2 text-xs text-muted-foreground">· déjà poussée</span>
                  )}
                </button>
              );
            })}
          {tab === 4 && customFiltered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune question perso pour l’instant. Crée-en une au-dessus.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
