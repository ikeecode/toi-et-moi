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

type NavKey = (typeof navItems)[number]['key'];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-3 sm:px-4">
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#170f24]/88 p-1.5 shadow-[0_28px_80px_rgba(7,3,13,0.4)] backdrop-blur-2xl">
        <div className="grid grid-cols-5 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[1.25rem] px-1.5 py-2 text-center transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-b from-[#2f1a3d] to-[#24152f] text-[#ffe0fd] shadow-[0_12px_30px_rgba(255,119,255,0.14)]'
                    : 'text-[#cbb6dd] hover:bg-white/[0.05] hover:text-[#fff1ff]'
                )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                      isActive ? 'bg-[#ffadf9] text-[#2a0a2a]' : 'bg-transparent'
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
