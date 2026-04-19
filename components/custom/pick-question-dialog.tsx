'use client';

import { useState, useTransition, type ReactElement } from 'react';
import { Search } from 'lucide-react';
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
  const [isPending, startTransition] = useTransition();

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
              Ajoutez vos propres questions depuis la carte « + » du fil.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
