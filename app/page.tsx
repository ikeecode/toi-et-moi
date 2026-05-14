import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Calendar, Heart, MessageCircle } from 'lucide-react';

import { AppPage, SurfacePanel } from '@/components/custom/page-shell';
import { createClient } from '@/lib/supabase/server';

const items = [
  { label: 'Questions', icon: MessageCircle },
  { label: 'Souvenirs', icon: Heart },
  { label: 'Agenda', icon: Calendar },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="relative isolate overflow-hidden">
      <AppPage bottomInset={false} className="max-w-4xl gap-6 pb-14">
        <header className="flex items-center justify-between gap-4 py-1">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/icons/icon-192.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
            />
            <span className="text-xl font-light italic tracking-tight text-[#dbe7ff]">
              Toi et Moi
            </span>
          </Link>

          <Link href="/auth/login" className="cta-secondary px-4 py-2.5 text-sm">
            Se connecter
          </Link>
        </header>

        <SurfacePanel className="rounded-[2.4rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-6">
            <span className="soft-chip">Simple. Privé. À deux.</span>

            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Une app calme pour ne pas perdre le fil.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Questions, souvenirs et dates importantes. Rien de plus.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/auth/signup" className="cta-primary">
                Créer un espace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/login" className="cta-secondary">
                Ouvrir mon espace
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-5"
                  >
                    <div className="icon-chip h-10 w-10 rounded-[0.95rem]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </SurfacePanel>
      </AppPage>
    </div>
  );
}
