'use client';

import { useState, useTransition } from 'react';
import { createEvent } from '@/app/calendar/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createEvent(formData);
        setOpen(false);
        toast.success('Événement ajouté.');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Impossible d'ajouter l'événement."
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
            Ajouter
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un événement</DialogTitle>
          <DialogDescription>
            Ajoutez une date importante à votre calendrier partagé.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="form-label">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="Dîner de la Saint-Valentin"
              required
              className="text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date" className="form-label">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              className="text-foreground"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type" className="form-label">Type</Label>
            <select
              id="type"
              name="type"
              required
              className="h-12 w-full rounded-2xl border border-input bg-input px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/35"
              defaultValue="date"
            >
              <option value="date">Rendez-vous</option>
              <option value="anniversary">Anniversaire</option>
              <option value="birthday">Anniversaire (naissance)</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="cta-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Ajout...' : 'Ajouter un événement'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
