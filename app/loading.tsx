import { AppPage, SurfacePanel } from '@/components/custom/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <AppPage className="max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>

        <SurfacePanel className="space-y-5">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-[1.4rem]" />
            <Skeleton className="h-28 rounded-[1.4rem]" />
          </div>
        </SurfacePanel>

        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36 rounded-[1.5rem]" />
          <Skeleton className="h-36 rounded-[1.5rem]" />
          <Skeleton className="h-36 rounded-[1.5rem]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-44 rounded-[1.5rem]" />
          <Skeleton className="h-44 rounded-[1.5rem]" />
          <Skeleton className="h-44 rounded-[1.5rem]" />
          <Skeleton className="h-44 rounded-[1.5rem]" />
        </div>
      </AppPage>
    </div>
  );
}
