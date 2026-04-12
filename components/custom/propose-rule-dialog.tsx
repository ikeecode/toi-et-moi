'use client';

import { useState, useTransition } from 'react';
import { proposeRule } from '@/app/rules/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ProposeRuleDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await proposeRule(formData);
        setOpen(false);
        toast.success('Règle proposée, en attente d\u2019approbation.');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible de proposer la règle.'
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-tr from-[#ffadf9] to-[#ff77ff] px-5 py-2.5 text-sm font-bold text-[#37003a] transition-shadow hover:shadow-[0_10px_30px_rgba(255,173,249,0.2)]">
            <Plus className="h-4 w-4" />
            Proposer
          </button>
        }
      />
      <DialogContent className="border-white/[0.08] bg-[#21172d] sm:rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-[#ecddfb]">Proposer une règle</DialogTitle>
          <DialogDescription className="text-[#d7c0d1]">
            Votre partenaire devra approuver cette règle pour qu&apos;elle soit validée.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label
              htmlFor="text"
              className="font-['Inter'] text-xs uppercase tracking-widest text-[#d7c0d1]"
            >
              Règle
            </Label>
            <textarea
              id="text"
              name="text"
              placeholder="Ex: Toujours se dire bonne nuit avant de dormir"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-[#2f263c] px-4 py-3 text-sm text-[#ecddfb] placeholder:text-[#d7c0d1]/50 focus:border-[#ffadf9]/40 focus:outline-none"
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#ffadf9] to-[#ff77ff] px-5 py-3 text-sm font-bold text-[#37003a] transition-shadow hover:shadow-[0_10px_30px_rgba(255,173,249,0.2)] disabled:opacity-50"
            >
              {isPending ? 'Envoi...' : 'Proposer cette règle'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
