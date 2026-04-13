import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export function AppPage({
  children,
  className,
  bottomInset = true,
}: {
  children: React.ReactNode;
  className?: string;
  bottomInset?: boolean;
}) {
  return (
    <main
      className={cn(
        'mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8',
        bottomInset && 'pb-36',
        className
      )}
    >
      {children}
    </main>
  );
}

export function SurfacePanel({
  className,
  tone = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'soft' | 'outline';
}) {
  const tones = {
    default: 'surface-panel',
    soft: 'surface-panel-soft',
    outline: 'surface-outline',
  } as const;

  return (
    <div
      className={cn('rounded-[1.75rem] p-5 sm:p-6', tones[tone], className)}
      {...props}
    />
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  badge,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <SurfacePanel className={className}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="section-kicker">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.45rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
        </div>

        {(badge || actions) && (
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {badge}
            {actions}
          </div>
        )}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </SurfacePanel>
  );
}

export function StatCard({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  className?: string;
}) {
  return (
    <SurfacePanel tone="soft" className={cn('gap-0', className)}>
      <p className="section-kicker">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{detail}</p>
    </SurfacePanel>
  );
}

export function InfoCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <SurfacePanel tone="soft" className={className}>
      {Icon ? (
        <div className="icon-chip h-11 w-11">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      {eyebrow ? <p className="section-kicker mt-4">{eyebrow}</p> : null}
      <p className={cn('text-lg font-semibold text-foreground', Icon && 'mt-4')}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </SurfacePanel>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <SurfacePanel
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-14 text-center',
        className
      )}
    >
      <div className="icon-chip h-14 w-14 rounded-[1.35rem]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="max-w-sm text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </SurfacePanel>
  );
}
