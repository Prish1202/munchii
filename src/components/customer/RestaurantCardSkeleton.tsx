import { Skeleton } from '@/components/ui/skeleton';

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-3.5 space-y-2.5">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-5 w-12 rounded-lg" />
        </div>
        <Skeleton className="h-3.5 w-48 rounded-lg" />
        <div className="flex justify-between pt-2.5 border-t border-border">
          <Skeleton className="h-3.5 w-20 rounded-lg" />
          <Skeleton className="h-3.5 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
