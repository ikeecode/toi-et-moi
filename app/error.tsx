'use client';

import Link from 'next/link';
import { RefreshCcw, TriangleAlert } from 'lucide-react';

import { AppPage, SurfacePanel } from '@/components/custom/page-shell';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen">
      <AppPage bottomInset={false} className="items-center justify-center pb-12">
        <SurfacePanel className="w-full max-w-lg p-8 text-center">
          <div className="mx-auto icon-chip h-14 w-14 rounded-[1.25rem]">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <p className="section-kicker mt-5">Une erreur est survenue</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            L’écran n’a pas pu se charger correctement.
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Réessayez maintenant. Si le problème persiste, revenez au tableau de
            bord puis relancez l’action.
          </p>
          {error.message ? (
            <p className="mt-4 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3 text-left text-sm text-muted-foreground">
              {error.message}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={reset} className="cta-primary flex-1">
              <RefreshCcw className="h-4 w-4" />
              Réessayer
            </button>
            <Link href="/dashboard" className="cta-secondary flex-1">
              Retour au tableau de bord
            </Link>
          </div>
        </SurfacePanel>
      </AppPage>
    </div>
  );
}
