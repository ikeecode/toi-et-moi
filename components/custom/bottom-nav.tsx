'use client';

import Link from 'next/link';
import { Home, Sparkles, Calendar, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: Home, label: 'Accueil' },
  { key: 'questions', href: '/questions', icon: Sparkles, label: 'Rituel' },
  { key: 'calendar', href: '/calendar', icon: Calendar, label: 'Agenda' },
  { key: 'memories', href: '/memories', icon: Heart, label: 'Histoire' },
] as const;

type NavKey = (typeof navItems)[number]['key'];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-3 sm:px-4">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-[#170f24]/88 p-2 shadow-[0_28px_80px_rgba(7,3,13,0.4)] backdrop-blur-2xl">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.4rem] px-2 py-2.5 text-center transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-b from-[#2f1a3d] to-[#24152f] text-[#ffe0fd] shadow-[0_12px_30px_rgba(255,119,255,0.14)]'
                    : 'text-[#cbb6dd] hover:bg-white/[0.05] hover:text-[#fff1ff]'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-[#ffadf9] text-[#2a0a2a]' : 'bg-transparent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[0.68rem] font-medium leading-none">
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
