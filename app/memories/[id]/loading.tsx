import { SurfacePanel } from '@/components/custom/page-shell';

export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <SurfacePanel className="space-y-4">
        <div className="skeleton-block h-8 w-2/3" />
        <div className="skeleton-block aspect-[4/3] w-full" />
        <div className="skeleton-block h-4 w-1/2" />
        <div className="skeleton-block h-20 w-full" />
      </SurfacePanel>
    </main>
  );
}
