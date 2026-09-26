import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Sparkles, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const burst = Array.from({ length: 14 });

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shortId = id?.slice(-6).toUpperCase();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-success', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('id, status').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const paid = !!order && order.status !== 'pending_payment' && order.status !== 'cancelled';

  useEffect(() => {
    if (paid && 'vibrate' in navigator) navigator.vibrate?.([60, 40, 120]);
  }, [paid]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!paid) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center text-center py-16 px-6 max-w-md mx-auto">
          <XCircle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="font-display font-bold text-2xl">Payment not completed</h1>
          <p className="text-muted-foreground mt-2 text-sm">This order was not placed because the payment wasn't confirmed.</p>
          <div className="flex gap-3 mt-8 w-full">
            <Button className="flex-1" onClick={() => navigate('/customer/checkout')}>Try again</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/customer')}>Home</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto relative overflow-hidden">
        {/* Expanding circle wash */}
        <motion.div
          className="absolute top-16 w-28 h-28 rounded-full bg-primary/15"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 9, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.5 }}
        />

        {/* Tick */}
        <div className="relative mb-6 mt-2">
          {burst.map((_, i) => {
            const a = (i / burst.length) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-primary"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{ x: Math.cos(a) * 80, y: Math.sin(a) * 80, opacity: [0, 1, 0], scale: [0, 1.2, 0.4] }}
                transition={{ duration: 0.9, delay: 0.75, ease: 'easeOut' }}
              />
            );
          })}
          <motion.div
            className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <svg viewBox="0 0 52 52" className="w-16 h-16">
              <motion.path
                d="M14 27 L23 36 L39 18"
                fill="none"
                className="stroke-primary-foreground"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.45, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        </div>

        <motion.h1
          className="font-display font-bold text-3xl text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          Order Placed!
        </motion.h1>

        <motion.p className="text-muted-foreground mt-2 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }}>
          Payment received. Order <span className="font-mono font-bold text-foreground">#{shortId}</span> is confirmed.
        </motion.p>

        <motion.div
          className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: 'spring' }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Coins will be credited on completion!</span>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-secondary/50 px-4 py-2.5 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <Clock className="w-4 h-4 text-primary" />
          You'll be notified when it's ready for pickup
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 mt-8 w-full"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <Link to={`/customer/orders/${id}`} className="flex-1">
            <Button className="w-full gap-2">
              Track Order <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/customer" className="flex-1">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
