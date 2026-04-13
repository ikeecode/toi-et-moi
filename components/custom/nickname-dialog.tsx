'use client';

import { useState } from 'react';
import { updateNickname } from '@/app/dashboard/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface NicknameDialogProps {
  partnerId: string;
  partnerDisplayName: string;
  currentNickname: string | null;
  children: React.ReactNode;
}

export function NicknameDialog({
  partnerId,
  partnerDisplayName,
  currentNickname,
  children,
}: NicknameDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await updateNickname(formData);
      setOpen(false);
      toast.success('Petit nom mis à jour.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Impossible de mettre à jour le petit nom.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button className="w-full min-w-0 overflow-hidden text-left" />}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Petit nom</DialogTitle>
          <DialogDescription>
            Choisissez un surnom pour {partnerDisplayName}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="partnerId" value={partnerId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname" className="form-label">
              Surnom
            </Label>
            <Input
              id="nickname"
              name="nickname"
              type="text"
              defaultValue={currentNickname ?? ''}
              placeholder="Mon cœur, Bébé, Chéri(e)..."
              className="text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser le prénom
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="cta-primary w-full"
          >
            {loading ? (
              'Enregistrement...'
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Enregistrer
              </span>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
