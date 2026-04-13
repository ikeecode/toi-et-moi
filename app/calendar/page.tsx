import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { AddEventDialog } from '@/components/custom/add-event-dialog';
import { EventList } from '@/components/custom/event-list';
import { BottomNav } from '@/components/custom/bottom-nav';
import { formatEventDate } from '@/lib/helpers';
import { AppPage, InfoCard, PageHero, SurfacePanel } from '@/components/custom/page-shell';

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
      <AppPage>
        <div className="flex flex-col gap-6">
          <PageHero
            eyebrow="Agenda du couple"
            title="Calendrier"
            description="Vos dates à venir."
            actions={<AddEventDialog />}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <SurfacePanel>
              <EventList events={events ?? []} />
            </SurfacePanel>

            <aside className="space-y-4">
              <SurfacePanel>
                <p className="section-kicker">Prochain repère</p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {nextEvent?.title || 'Aucune date enregistrée'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {nextEvent
                    ? formatEventDate(nextEvent.date)
                    : 'Ajoutez une date'}
                </p>
              </SurfacePanel>

              <InfoCard
                icon={CalendarDays}
                title={`${events?.length ?? 0} événement${(events?.length ?? 0) > 1 ? 's' : ''}`}
                description="Vue simple et triée."
              />
            </aside>
          </div>
        </div>
      </AppPage>

      <BottomNav active="calendar" />
    </div>
  );
}
