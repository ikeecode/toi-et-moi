'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditMemoryDialog } from '@/components/custom/edit-memory-dialog';
import { Conversation } from '@/components/custom/conversation/conversation';
import { deleteMemory } from '@/app/memories/actions';
import { formatRelativeDate } from '@/lib/helpers';
import type { MessageRow } from '@/lib/conversations/types';

interface Photo {
  id: string;
  image_url: string;
}

interface Props {
  memory: {
    id: string;
    title: string;
    description: string | null;
    date: string;
  };
  photos: Photo[];
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>;
  authorNameById: Record<string, string>;
}

export function MemoryDetailView(props: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const form = new FormData();
    form.append('memoryId', props.memory.id);
    startTransition(async () => {
      try {
        await deleteMemory(form);
        toast.success('Souvenir supprimé.');
        router.push('/memories');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Impossible de supprimer.'
        );
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col pb-36">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[#0b0d12]/80 px-4 py-3 backdrop-blur-lg">
        <Link
          href="/memories"
          aria-label="Retour"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-semibold text-foreground">Souvenir</h1>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
            aria-label="Menu"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setConfirmDelete(true)}
              className="text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <EditMemoryDialog
        memory={props.memory}
        photos={props.photos}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <section className="px-4 py-4">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03]">
          <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto">
            {props.photos.length > 0 ? (
              props.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={props.memory.title}
                  className="aspect-[4/3] w-full shrink-0 snap-start object-cover"
                />
              ))
            ) : (
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-[#8fb2ff]/12 via-[#151922] to-[#465a93]/12" />
            )}
          </div>
          <div className="space-y-2 p-5">
            <h2 className="text-xl font-semibold text-foreground">
              {props.memory.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(props.memory.date)}
            </p>
            {props.memory.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {props.memory.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="px-4">
        <p className="section-kicker">Discussion</p>
      </div>

      <div className="flex-1 px-4 pb-4 pt-2">
        <Conversation
          coupleId={props.coupleId}
          currentUserId={props.currentUserId}
          otherUserId={props.otherUserId}
          contextType="memory"
          contextId={props.memory.id}
          initialMessages={props.initialMessages}
          initialReads={props.initialReads}
          authorNameById={props.authorNameById}
          placeholder="Écrire un commentaire…"
        />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-panel w-full max-w-sm space-y-4 rounded-[1.5rem] p-6 text-center">
            <p className="text-base font-semibold">Supprimer ce souvenir ?</p>
            <p className="text-sm text-muted-foreground">
              Les photos et la discussion seront aussi effacées.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="cta-secondary h-10 px-5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="cta-primary h-10 px-5"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
