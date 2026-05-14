import type { Metadata } from 'next';
import { OfflineGames } from '@/components/custom/offline-games';

export const metadata: Metadata = {
  title: 'Hors ligne — Toi & Moi',
  description: 'Pas de connexion ? Voici de quoi patienter.',
};

export const dynamic = 'force-static';

export default function OfflinePage() {
  return <OfflineGames />;
}
