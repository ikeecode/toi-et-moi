import Link from 'next/link';
import { Heart, MessageCircle, Shield } from 'lucide-react';

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,173,249,0.2),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,_rgba(138,113,255,0.14),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_bottom,_rgba(92,64,132,0.28),_transparent_60%)]" />

      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,480px)]">
        <section className="relative z-10 hidden lg:flex flex-col gap-8 pr-6">
          <Link
            href="/"
            className="w-fit text-3xl font-light italic tracking-tight text-[#ffb0f4]"
          >
            Toi et Moi
          </Link>

          <div className="max-w-xl space-y-5">
            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[0.68rem] font-semibold tracking-[0.26em] text-[#d7c0d1]/80 uppercase">
              {kicker}
            </span>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-tight text-[#f5e9ff] text-balance">
              {title}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-[#d7c0d1]">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = highlightIcons[index % highlightIcons.length];
              return (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(7,3,13,0.24)] backdrop-blur-xl"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffadf9]/14 text-[#ffadf9]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#f4e8ff]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#bda7d0]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative z-10 flex flex-col gap-5">
          <Link
            href="/"
            className="mx-auto text-2xl font-light italic tracking-tight text-[#ffb0f4] lg:hidden"
          >
            Toi et Moi
          </Link>

          <div className="space-y-3 text-center lg:hidden">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] font-semibold tracking-[0.22em] text-[#d7c0d1]/80 uppercase">
              {kicker}
            </span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#f5e9ff] text-balance">
              {title}
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#c9b6d8]">
              {description}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_100px_rgba(7,3,13,0.34)] backdrop-blur-2xl sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
