import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const shortId = id?.slice(-6).toUpperCase();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="font-display font-bold text-2xl text-foreground">
          Order Placed! 🎉
        </h1>

        <p className="text-muted-foreground mt-2 text-sm">
          Your order <span className="font-mono font-bold text-foreground">#{shortId}</span> has been placed successfully.
        </p>

        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground bg-secondary/50 px-4 py-2.5 rounded-xl">
          <Clock className="w-4 h-4 text-primary" />
          You'll be notified when it's ready for pickup
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
          <Link to={`/customer/orders/${id}`} className="flex-1">
            <Button className="w-full gap-2">
              Track Order
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/customer" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
