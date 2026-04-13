'use client';

import Link from 'next/link';
import { Home, Sparkles, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: Home, label: 'Accueil' },
  { key: 'questions', href: '/questions', icon: Sparkles, label: 'Rituel' },
  { key: 'rules', href: '/rules', icon: ShieldCheck, label: 'Règles' },
  { key: 'calendar', href: '/calendar', icon: Calendar, label: 'Agenda' },
  { key: 'memories', href: '/memories', icon: Heart, label: 'Histoire' },
] as const;

export type NavKey = (typeof navItems)[number]['key'];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 px-3 sm:px-4">
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#151922]/78 p-1.5 shadow-[0_22px_52px_rgba(3,5,12,0.4)] backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[1.2rem] px-1.5 py-2.5 text-center transition-all duration-200',
                  isActive
                    ? 'bg-white/[0.08] text-[#f5f7fb]'
                    : 'text-[#98a2b3] hover:bg-white/[0.04] hover:text-[#f5f7fb]'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-[#8fb2ff] text-[#09111f]'
                      : 'bg-transparent text-current'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="max-w-full truncate text-[0.64rem] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
