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
import { Textarea } from '@/components/ui/textarea';

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
          <button className="cta-primary px-5 py-2.5">
            <Plus className="h-4 w-4" />
            Proposer
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proposer une règle</DialogTitle>
          <DialogDescription>
            Votre partenaire devra approuver cette règle pour qu&apos;elle soit validée.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="text" className="form-label">
              Règle
            </Label>
            <Textarea
              id="text"
              name="text"
              placeholder="Ex: Toujours se dire bonne nuit avant de dormir"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              className="min-h-28 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="cta-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Envoi...' : 'Proposer cette règle'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
