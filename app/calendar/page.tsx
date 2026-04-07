import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarDays, Sparkles } from 'lucide-react';
import { AddEventDialog } from '@/components/custom/add-event-dialog';
import { EventList } from '@/components/custom/event-list';
import { BottomNav } from '@/components/custom/bottom-nav';
import { formatEventDate } from '@/lib/helpers';

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: coupleMember } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .single();

  if (!coupleMember) {
    redirect('/setup');
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('couple_id', coupleMember.couple_id)
    .order('date', { ascending: true });

  const nextEvent = events?.[0] ?? null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-40 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="surface-panel rounded-[2.2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Agenda du couple</p>
                <h1 className="mt-2 text-3xl font-bold italic tracking-tight text-[#ecddfb] sm:text-4xl">
                  Calendrier
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d7c0d1]">
                  Restez synchronisés sur les rendez-vous, les anniversaires et
                  les prochaines dates qui méritent d’être anticipées.
                </p>
              </div>
              <AddEventDialog />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
              <EventList events={events ?? []} />
            </section>

            <aside className="space-y-4">
              <div className="surface-panel rounded-[1.9rem] p-5">
                <p className="section-kicker">Prochain repère</p>
                <p className="mt-3 text-lg font-semibold text-[#f5e9ff]">
                  {nextEvent?.title || 'Aucune date enregistrée'}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                  {nextEvent
                    ? formatEventDate(nextEvent.date)
                    : 'Ajoutez un événement pour transformer cette page en agenda réellement utile.'}
                </p>
              </div>

              <div className="surface-panel rounded-[1.9rem] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffadf9]/12 text-[#ffadf9]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="mt-4 text-lg font-semibold text-[#f5e9ff]">
                  Une vue faite pour anticiper
                </p>
                <p className="mt-2 text-sm leading-7 text-[#baa6cd]">
                  L’objectif ici n’est pas seulement de stocker des dates, mais
                  de garder les prochains moments visibles au bon moment.
                </p>
              </div>

              <div className="surface-panel-soft rounded-[1.9rem] p-5">
                <div className="flex items-center gap-2 text-[#ffbdf8]">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-semibold">Astuce UX</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#baa6cd]">
                  Commencez par 3 repères maximum: un rendez-vous, un anniversaire
                  et une prochaine sortie. Le calendrier reste plus lisible.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BottomNav active="calendar" />
    </div>
  );
}
