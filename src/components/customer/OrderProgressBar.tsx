import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Store, ChefHat, ShoppingBag, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/hooks/useOrders';

const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'placed', label: 'Placed', icon: <Package className="w-3.5 h-3.5" /> },
  { status: 'accepted', label: 'Accepted', icon: <Store className="w-3.5 h-3.5" /> },
  { status: 'preparing', label: 'Preparing', icon: <ChefHat className="w-3.5 h-3.5" /> },
  { status: 'ready_for_pickup', label: 'Ready', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { status: 'completed', label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

const STATUS_INDEX: Record<string, number> = {
  placed: 0,
  accepted: 1,
  preparing: 2,
  ready_for_pickup: 3,
  picked_up: 4,
  completed: 4,
};

interface OrderProgressBarProps {
  status: string;
}

export function OrderProgressBar({ status }: OrderProgressBarProps) {
  const currentIndex = STATUS_INDEX[status] ?? 0;
  const progressPercent = (currentIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="space-y-3">
      <Progress value={progressPercent} className="h-2 rounded-full" />
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.status} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                  isCompleted
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
