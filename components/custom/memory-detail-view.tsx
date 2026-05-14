'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Pencil, Trash2, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditMemoryDialog } from '@/components/custom/edit-memory-dialog';
import { Conversation } from '@/components/custom/conversation/conversation';
import {
  requestMemoryDeletion,
  cancelMemoryDeletion,
  approveMemoryDeletion,
} from '@/app/memories/actions';
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
    pending_deletion_at: string | null;
    pending_deletion_by: string | null;
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
  const [confirmRequest, setConfirmRequest] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      else if (event.key === 'ArrowLeft')
        setLightboxIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      else if (event.key === 'ArrowRight')
        setLightboxIndex((i) =>
          i === null ? null : Math.min(props.photos.length - 1, i + 1)
        );
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, props.photos.length]);

  const isPendingDeletion = props.memory.pending_deletion_at !== null;
  const isRequester =
    isPendingDeletion && props.memory.pending_deletion_by === props.currentUserId;
  const requesterName = props.memory.pending_deletion_by
    ? props.authorNameById[props.memory.pending_deletion_by] ?? 'Votre partenaire'
    : '';

  function handleRequestDeletion() {
    startTransition(async () => {
      try {
        await requestMemoryDeletion(props.memory.id);
        toast.success("Demande de suppression envoyée à votre partenaire.");
        setConfirmRequest(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Échec de la demande.'
        );
      }
    });
  }

  function handleCancelDeletion() {
    startTransition(async () => {
      try {
        await cancelMemoryDeletion(props.memory.id);
        toast.success('Demande annulée.');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Impossible d'annuler."
        );
      }
    });
  }

  function handleApproveDeletion() {
    startTransition(async () => {
      try {
        await approveMemoryDeletion(props.memory.id);
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
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </DropdownMenuItem>
            {!isPendingDeletion && (
              <DropdownMenuItem
                onClick={() => setConfirmRequest(true)}
                className="text-red-300"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Demander la suppression
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <EditMemoryDialog
        memory={props.memory}
        photos={props.photos}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {isPendingDeletion && (
        <section className="px-4 pt-4">
          <div className="rounded-[1.25rem] border border-red-400/30 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {isRequester
                    ? 'Suppression en attente de l’accord de votre partenaire'
                    : `${requesterName} a demandé la suppression de ce souvenir`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  La suppression est définitive : photos, description et discussion seront effacées.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {isRequester ? (
                    <button
                      type="button"
                      onClick={handleCancelDeletion}
                      disabled={isPending}
                      className="cta-secondary h-9 px-4 text-[0.82rem]"
                    >
                      Annuler la demande
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleApproveDeletion}
                        disabled={isPending}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-red-500/90 px-4 text-[0.82rem] font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" /> Approuver la suppression
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDeletion}
                        disabled={isPending}
                        className="cta-secondary h-9 px-4 text-[0.82rem]"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-4">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03]">
          {props.photos.length === 0 ? (
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-[#8fb2ff]/12 via-[#151922] to-[#465a93]/12" />
          ) : props.photos.length === 1 ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="block w-full"
              aria-label="Agrandir la photo"
            >
              <img
                src={props.photos[0].image_url}
                alt={props.memory.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ) : (
            <div
              className={
                props.photos.length === 2
                  ? 'grid grid-cols-2 gap-1'
                  : props.photos.length === 3
                    ? 'grid grid-cols-2 gap-1'
                    : 'grid grid-cols-3 gap-1'
              }
            >
              {props.photos.map((photo, idx) => {
                const isFirstOfThree =
                  props.photos.length === 3 && idx === 0;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={
                      'relative block overflow-hidden ' +
                      (isFirstOfThree ? 'col-span-2 row-span-1' : '')
                    }
                    aria-label={`Photo ${idx + 1} sur ${props.photos.length}`}
                  >
                    <img
                      src={photo.image_url}
                      alt={`${props.memory.title} — photo ${idx + 1}`}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-opacity hover:opacity-90"
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2 p-5">
            <h2 className="text-xl font-semibold text-foreground">
              {props.memory.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(props.memory.date)}
              {props.photos.length > 0 && (
                <> · {props.photos.length} photo{props.photos.length > 1 ? 's' : ''}</>
              )}
            </p>
            {props.memory.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {props.memory.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {lightboxIndex !== null && props.photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxIndex > 0 && (
            <button
              type="button"
              aria-label="Photo précédente"
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? null : i - 1));
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {lightboxIndex < props.photos.length - 1 && (
            <button
              type="button"
              aria-label="Photo suivante"
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i === null ? null : i + 1
                );
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <img
            src={props.photos[lightboxIndex].image_url}
            alt={`${props.memory.title} — photo ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {lightboxIndex + 1} / {props.photos.length}
          </div>
        </div>
      )}

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

      {confirmRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-panel w-full max-w-sm space-y-4 rounded-[1.5rem] p-6 text-center">
            <p className="text-base font-semibold">Demander la suppression ?</p>
            <p className="text-sm text-muted-foreground">
              Votre partenaire devra approuver avant que le souvenir soit
              définitivement supprimé.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmRequest(false)}
                className="cta-secondary h-10 px-5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={isPending}
                className="cta-primary h-10 px-5"
              >
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
