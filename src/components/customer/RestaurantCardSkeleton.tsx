import { Skeleton } from '@/components/ui/skeleton';

export function RestaurantCardSkeleton() {
  return (
    <div className="gradient-surface rounded-[1.75rem] border border-border/80 overflow-hidden shadow-soft">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
        </div>
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
