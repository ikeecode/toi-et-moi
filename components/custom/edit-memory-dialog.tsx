'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { updateMemory } from '@/app/memories/actions';
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
import { Pencil, ImageIcon, X } from 'lucide-react';
import { getImageUploadHint, validateImageUpload } from '@/lib/image-upload';

interface Photo {
  id: string;
  image_url: string;
}

interface EditMemoryDialogProps {
  memory: {
    id: string;
    title: string;
    description: string | null;
    date: string;
  };
  photos: Photo[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditMemoryDialog({
  memory,
  photos,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditMemoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (next: boolean) => controlledOnOpenChange?.(next)
    : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<Set<string>>(
    new Set()
  );
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const visiblePhotos = photos.filter((p) => !removedPhotoIds.has(p.id));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    const validationError = validateImageUpload(selectedFiles);

    if (validationError) {
      toast.error(validationError);
      e.target.value = '';
      setNewPreviews([]);
      return;
    }

    setNewPreviews(selectedFiles.map((f) => URL.createObjectURL(f)));
  }

  function handleRemovePhoto(photoId: string) {
    setRemovedPhotoIds((prev) => new Set([...prev, photoId]));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      formData.set('memoryId', memory.id);

      for (const id of removedPhotoIds) {
        formData.append('removedPhotoIds', id);
      }

      const newFiles = fileInputRef.current?.files;
      if (newFiles) {
        for (const file of Array.from(newFiles)) {
          formData.append('newImages', file);
        }
      }

      const newImages = (formData.getAll('newImages') as File[]).filter(
        (image) => image && image.size > 0
      );
      if (newImages.length > 0) {
        const validationError = validateImageUpload(newImages);
        if (validationError) {
          toast.error(validationError);
          return;
        }
      }

      await updateMemory(formData);
      router.refresh();
      setOpen(false);
      toast.success('Souvenir mis à jour.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'La mise à jour a échoué.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && loading) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setRemovedPhotoIds(new Set());
      setNewPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger
          render={
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1118]/75 text-foreground opacity-100 backdrop-blur-sm transition-all hover:bg-[#8fb2ff]/24 hover:text-white sm:opacity-0 sm:group-hover:opacity-100">
              <Pencil className="h-3 w-3" />
              <span className="sr-only">Modifier le souvenir</span>
            </button>
          }
        />
      )}
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        showCloseButton={!loading}
      >
        <DialogHeader>
          <DialogTitle>Modifier le souvenir</DialogTitle>
          <DialogDescription>
            Mettez à jour les détails ou les photos de ce moment.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={loading} className="contents">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-title" className="form-label">
              Titre <span aria-hidden className="text-[#ff9aa2]">*</span>
            </Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={memory.title}
              required
              className="text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description" className="form-label">
              Description <span aria-hidden className="text-[#ff9aa2]">*</span>
            </Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={memory.description ?? ''}
              rows={3}
              required
              className="min-h-28 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-date" className="form-label">
              Date <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              id="edit-date"
              name="date"
              type="date"
              defaultValue={memory.date}
              className="text-foreground"
            />
          </div>

          {visiblePhotos.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="form-label">
                Photos existantes
              </Label>
              <div className="flex flex-wrap gap-2">
                {visiblePhotos.map((photo) => (
                  <div key={photo.id} className="group/photo relative">
                    <img
                      src={photo.image_url}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="form-label">
              Ajouter des photos
            </Label>
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.6rem] border-2 border-dashed border-white/12 bg-white/[0.03] p-6 transition-colors hover:border-[#8fb2ff]/40"
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {newPreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto rounded-[1.35rem] bg-white/[0.03] p-2">
              {newPreviews.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Aperçu ${i + 1}`}
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
              'Enregistrer les modifications'
            )}
          </button>
          </fieldset>
        </form>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-popover/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#8fb2ff] border-t-transparent" />
              <p className="text-sm font-medium text-foreground">
                Mise à jour du souvenir…
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
