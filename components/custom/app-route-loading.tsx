import { BottomNav, type NavKey } from '@/components/custom/bottom-nav';
import { AppPage, SurfacePanel } from '@/components/custom/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export function AppRouteLoading({ active }: { active: NavKey }) {
  return (
    <div className="min-h-screen">
      <AppPage className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <SurfacePanel className="space-y-4 rounded-[2rem] px-6 py-5 sm:px-8 sm:py-7">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-28 rounded-[0.9rem]" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
          <Skeleton className="h-[52svh] rounded-[1.6rem]" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-11 w-11 rounded-full" />
          </div>
        </SurfacePanel>
      </AppPage>

      <BottomNav active={active} />
    </div>
  );
}
