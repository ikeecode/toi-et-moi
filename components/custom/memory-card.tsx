import Link from 'next/link';
import { formatRelativeDate } from '@/lib/helpers';
import { ImageIcon } from 'lucide-react';

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

export function MemoryCard({ memory, coverPhoto }: MemoryCardProps) {
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="group relative break-inside-avoid overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-[12px] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(216,154,130,0.12)]"
    >
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
    </Link>
  );
}
