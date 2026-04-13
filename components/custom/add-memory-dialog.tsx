'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createMemory } from '@/app/memories/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ImageIcon } from 'lucide-react';
import { getImageUploadHint, validateImageUpload } from '@/lib/image-upload';

export function AddMemoryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    const validationError = validateImageUpload(selectedFiles);

    if (validationError) {
      toast.error(validationError);
      e.target.value = '';
      setPreviews([]);
      return;
    }

    const urls: string[] = [];
    for (const file of selectedFiles) {
      urls.push(URL.createObjectURL(file));
    }
    setPreviews(urls);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const images = (formData.getAll('images') as File[]).filter(
        (image) => image && image.size > 0
      );
      const validationError = validateImageUpload(images);

      if (validationError) {
        toast.error(validationError);
        return;
      }

      await createMemory(formData);
      router.refresh();
      setOpen(false);
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Votre souvenir a été ajouté.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'La création du souvenir a échoué.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="cta-primary px-5 py-2.5">
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un souvenir</DialogTitle>
          <DialogDescription>
            Capturez un moment spécial partagé ensemble.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className="form-label">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="Notre moment spécial..."
              required
              className="text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="form-label">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Racontez l'histoire..."
              rows={3}
              className="min-h-28 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date" className="form-label">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              className="text-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="images" className="form-label">Photos</Label>
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.6rem] border-2 border-dashed border-white/12 bg-white/[0.03] p-6 transition-colors hover:border-[#8fb2ff]/40"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-foreground">Cliquez pour ajouter des photos</span>
              <span className="text-center text-[11px] leading-5 text-muted-foreground">
                {getImageUploadHint()}
              </span>
            </div>
            <Input
              ref={fileInputRef}
              id="images"
              name="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {previews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto rounded-[1.35rem] bg-white/[0.03] p-2">
              {previews.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cta-primary mt-1 w-full disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#09111f] border-t-transparent" />
                Enregistrement...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
