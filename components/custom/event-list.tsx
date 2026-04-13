'use client';

import { deleteEvent } from '@/app/calendar/actions';
import { formatEventDate } from '@/lib/helpers';
import { Trash2, Heart, Star, Gift, CalendarDays, LoaderCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useFormStatus } from 'react-dom';

type Event = {
  id: string;
  title: string;
  date: string;
  type: 'date' | 'anniversary' | 'birthday' | 'other';
};

const typeConfig: Record<
  Event['type'],
  { dotColor: string; glowColor: string; icon: typeof Heart }
> = {
  date: {
    dotColor: 'bg-[#8fb2ff]',
    glowColor: 'shadow-[0_0_8px_#8fb2ff]',
    icon: Heart,
  },
  anniversary: {
    dotColor: 'bg-[#b8c9ff]',
    glowColor: 'shadow-[0_0_8px_#b8c9ff]',
    icon: Star,
  },
  birthday: {
    dotColor: 'bg-[#FFBF00]',
    glowColor: 'shadow-[0_0_8px_#FFBF00]',
    icon: Gift,
  },
  other: {
    dotColor: 'bg-[#00A3FF]',
    glowColor: 'shadow-[0_0_8px_#00A3FF]',
    icon: CalendarDays,
  },
};

function groupByMonth(events: Event[]): Record<string, Event[]> {
  const groups: Record<string, Event[]> = {};
  for (const event of events) {
    const key = format(new Date(event.date), 'MMMM yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return groups;
}

function DeleteEventButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Supprimer</span>
    </button>
  );
}

export function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="icon-chip h-14 w-14 rounded-[1.3rem]">
          <CalendarDays className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Aucun événement. Ajoutez votre première date spéciale !
        </p>
      </div>
    );
  }

  const grouped = groupByMonth(events);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {month}
          </h2>
          <div className="space-y-3">
            {monthEvents.map((event) => {
              const config = typeConfig[event.type];
              const Icon = config.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-[12px] transition-all duration-200 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${config.dotColor} ${config.glowColor}`}
                    />
                    <Icon className="h-4 w-4 text-[#dbe7ff]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(event.date)}
                    </p>
                  </div>
                  <form action={deleteEvent}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <DeleteEventButton />
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
