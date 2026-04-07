import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function daysTogether(anniversaryDate: string | Date): number {
  const start = new Date(anniversaryDate);
  const now = new Date();
  return differenceInDays(now, start);
}

export function formatEventDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return 'Demain';
  return format(d, 'd MMM yyyy', { locale: fr });
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  return format(d, 'd MMMM yyyy', { locale: fr });
}

export function getInviteUrl(inviteCode: string, baseUrl?: string): string {
  const fallbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return new URL(`/invite/${inviteCode}`, baseUrl || fallbackBaseUrl).toString();
}
