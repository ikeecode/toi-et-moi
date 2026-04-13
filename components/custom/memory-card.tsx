'use client';

import { deleteMemory } from '@/app/memories/actions';
import { EditMemoryDialog } from '@/components/custom/edit-memory-dialog';
import { formatRelativeDate } from '@/lib/helpers';
import { Trash2, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Photo {
  id: string;
  image_url: string;
}

interface MemoryCardProps {
  memory: {
    id: string;
    title: string;
    description: string | null;
    date: string;
  };
  coverPhoto: string | null;
  photos: Photo[];
}

export function MemoryCard({ memory, coverPhoto, photos }: MemoryCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(formData: FormData) {
    setDeleting(true);
    try {
      await deleteMemory(formData);
      toast.success('Souvenir supprimé.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Impossible de supprimer ce souvenir.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="group relative break-inside-avoid overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-[12px] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(216,154,130,0.12)]">
      <div className="relative w-full overflow-hidden">
        {coverPhoto ? (
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={coverPhoto}
              alt={memory.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#130f0e] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[#8fb2ff]/12 via-[#151922] to-[#465a93]/12">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute right-2 top-2 flex gap-1.5">
          <EditMemoryDialog memory={memory} photos={photos} />

          <form action={handleDelete}>
            <input type="hidden" name="memoryId" value={memory.id} />
            <button
              type="submit"
              disabled={deleting}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1118]/75 text-foreground opacity-100 backdrop-blur-sm transition-all hover:bg-red-500/30 hover:text-red-200 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Supprimer le souvenir</span>
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
          {memory.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatRelativeDate(memory.date)}
        </p>
        {memory.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {memory.description}
          </p>
        )}
      </div>
    </div>
  );
}
