import Link from 'next/link';
import { Heart, MessageCircle, Shield } from 'lucide-react';

import { SurfacePanel } from '@/components/custom/page-shell';

type Highlight = {
  title: string;
  description: string;
};

interface AuthShellProps {
  kicker: string;
  title: string;
  description: string;
  highlights: Highlight[];
  children: React.ReactNode;
}

const highlightIcons = [Heart, MessageCircle, Shield] as const;

export function AuthShell({
  kicker,
  title,
  description,
  highlights,
  children,
}: AuthShellProps) {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,460px)]">
        <section className="relative z-10 hidden flex-col gap-8 lg:flex">
          <Link
            href="/"
            className="w-fit text-3xl font-light italic tracking-tight text-[#dbe7ff]"
          >
            Toi et Moi
          </Link>

          <div className="max-w-xl space-y-5">
            <span className="accent-chip">{kicker}</span>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-tight text-foreground text-balance">
              {title}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = highlightIcons[index % highlightIcons.length];
              return (
                <SurfacePanel key={item.title} tone="soft" className="h-full">
                  <div className="icon-chip h-11 w-11">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </SurfacePanel>
              );
            })}
          </div>
        </section>

        <section className="relative z-10 flex flex-col gap-5">
          <Link
            href="/"
            className="mx-auto text-2xl font-light italic tracking-tight text-[#dbe7ff] lg:hidden"
          >
            Toi et Moi
          </Link>

          <div className="space-y-3 text-center lg:hidden">
            <span className="accent-chip">{kicker}</span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground text-balance">
              {title}
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <SurfacePanel className="rounded-[2rem] p-6 sm:p-8">
            {children}
          </SurfacePanel>
        </section>
      </div>
    </div>
  );
}
