'use client';

import { useState, useRef, useTransition } from 'react';
import { Plus, Trash2, X, Loader2, ImageIcon } from 'lucide-react';
import { uploadAlbumPhotos, deleteAlbumPhoto } from '@/app/album/actions';

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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    startTransition(async () => {
      await uploadAlbumPhotos(formData);
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
      await deleteAlbumPhoto(formData);
      if (viewerPhoto?.name === photo.name) {
        setViewerPhoto(null);
      }
    });
  };

  return (
    <div className="mt-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="font-['Inter'] text-xs uppercase tracking-widest text-[#d7c0d1]">
          Photos de couple
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#ffadf9] to-[#ff77ff] px-5 py-2 text-xs font-bold text-[#37003a] transition-transform hover:scale-105 disabled:opacity-50"
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

      {/* Loading overlay */}
      {isPending && photos.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#d7c0d1]">
          <Loader2 className="h-4 w-4 animate-spin text-[#ffadf9]" />
          Chargement...
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && !isPending && (
        <div className="mt-10 flex flex-col items-center rounded-[2rem] bg-white/5 backdrop-blur-[12px] border border-white/[0.08] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2f263c]">
            <ImageIcon className="h-8 w-8 text-[#d7c0d1]" />
          </div>
          <p className="mt-4 text-sm text-[#d7c0d1] max-w-xs">
            Aucune photo dans l&apos;album. Commencez &agrave; partager vos
            moments !
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#ffadf9] to-[#ff77ff] px-6 py-2.5 text-xs font-bold text-[#37003a] transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Ajouter des photos
          </button>
        </div>
      )}

      {/* Photos grid */}
      {photos.length > 0 && (
        <div className="mt-6 columns-2 gap-3 space-y-3">
          {photos.map((photo) => (
            <div
              key={photo.name}
              className="group relative break-inside-avoid rounded-2xl bg-white/5 backdrop-blur-[12px] border border-white/[0.08] overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => setViewerPhoto(photo)}
            >
              <img
                src={photo.url}
                alt="Photo de couple"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Delete button */}
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

      {/* Full-screen photo viewer */}
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
