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
    if (!nextOpen && loading) return;
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
      <DialogContent
        className="flex flex-col overflow-hidden sm:max-w-md"
        showCloseButton={!loading}
      >
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>Créer un souvenir</DialogTitle>
          <DialogDescription>
            Capturez un moment spécial partagé ensemble.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="min-h-0 flex-1">
          <fieldset disabled={loading} className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="form-label">
                Titre <span aria-hidden className="text-[#ff9aa2]">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Notre moment spécial..."
                required
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="form-label">
                Description <span aria-hidden className="text-[#ff9aa2]">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Racontez l'histoire..."
                rows={3}
                required
                className="min-h-24 text-foreground placeholder:text-muted-foreground sm:min-h-28"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date" className="form-label">
                Date <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                className="text-foreground"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="images" className="form-label">
                Photos <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.6rem] border-2 border-dashed border-white/12 bg-white/[0.03] p-4 transition-colors hover:border-[#8fb2ff]/40 sm:p-6"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-foreground">
                  Cliquez pour ajouter des photos
                </span>
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

            <div className="sticky bottom-0 -mx-1 bg-popover/96 pb-1 pt-2 supports-backdrop-filter:backdrop-blur-xl">
              <button
                type="submit"
                disabled={loading}
                className="cta-primary w-full disabled:opacity-50"
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
            </div>
          </fieldset>
        </form>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-popover/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#8fb2ff] border-t-transparent" />
              <p className="text-sm font-medium text-foreground">
                Création du souvenir…
              </p>
              <p className="text-xs text-muted-foreground">
                Merci de patienter, l’envoi peut prendre quelques secondes.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
