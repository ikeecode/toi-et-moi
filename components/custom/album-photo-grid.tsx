'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { uploadAlbumPhotos, deleteAlbumPhoto } from '@/app/album/actions';
import { getImageUploadHint, validateImageUpload } from '@/lib/image-upload';

interface AlbumPhoto {
  name: string;
  url: string;
}

export function AlbumPhotoGrid({
  photos,
  coupleId,
}: {
  photos: AlbumPhoto[];
  coupleId: string;
}) {
  const [viewerPhoto, setViewerPhoto] = useState<AlbumPhoto | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const validationError = validateImageUpload(selectedFiles);

    if (validationError) {
      toast.error(validationError);
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('images', file);
    }

    startTransition(async () => {
      try {
        await uploadAlbumPhotos(formData);
        router.refresh();
        toast.success(
          selectedFiles.length > 1
            ? 'Les photos ont été ajoutées à votre album.'
            : 'La photo a été ajoutée à votre album.'
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "L'envoi des photos a échoué.";
        toast.error(message);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (photo: AlbumPhoto) => {
    const filePath = `album/${coupleId}/${photo.name}`;
    const formData = new FormData();
    formData.append('filePath', filePath);

    startTransition(async () => {
      try {
        await deleteAlbumPhoto(formData);
        router.refresh();
        toast.success('La photo a été supprimée.');
        if (viewerPhoto?.name === photo.name) {
          setViewerPhoto(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'La suppression a échoué.';
        toast.error(message);
      }
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Photos de couple
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{getImageUploadHint()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="cta-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter des photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {isPending && photos.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#8fb2ff]" />
          Chargement...
        </div>
      )}

      {photos.length === 0 && !isPending && (
        <div className="mt-10 flex flex-col items-center rounded-[1.8rem] border border-white/[0.08] bg-white/[0.03] p-8 text-center backdrop-blur-[12px]">
          <div className="icon-chip h-16 w-16 rounded-[1.5rem]">
            <ImageIcon className="h-8 w-8" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Aucune photo dans l&apos;album. Commencez &agrave; partager vos
            moments !
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="cta-primary mt-4 px-6 py-2.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Ajouter des photos
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-6 columns-2 gap-3 space-y-3">
          {photos.map((photo) => (
            <div
              key={photo.name}
              className="group relative break-inside-avoid overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] cursor-pointer backdrop-blur-[12px] transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => setViewerPhoto(photo)}
            >
              <img
                src={photo.url}
                alt="Photo de couple"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo);
                }}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white/80 opacity-100 transition-all duration-300 hover:bg-red-500/80 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {viewerPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setViewerPhoto(null)}
        >
          <button
            onClick={() => setViewerPhoto(null)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={viewerPhoto.url}
            alt="Photo de couple"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
