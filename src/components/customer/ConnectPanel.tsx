import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/customer/EmptyState';
import { Phone, Video, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectPanel() {
  const notReady = () => toast.info('Calling is coming soon to Munchii.');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={notReady}>
          <Phone className="w-4 h-4" />
          <span className="text-xs">Voice call</span>
        </Button>
        <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={notReady}>
          <Video className="w-4 h-4" />
          <span className="text-xs">Video call</span>
        </Button>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
          Recent
        </p>
        <EmptyState
          icon={<PhoneCall className="w-7 h-7 text-primary" />}
          title="No calls yet"
          description="Your recent voice and video calls will appear here. Group and club calls are on the way."
        />
      </div>
    </div>
  );
}
