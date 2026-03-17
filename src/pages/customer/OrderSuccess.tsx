import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const confettiEmojis = ['🎉', '🍕', '⭐', '🔥', '💰', '🎊', '✨', '🥳'];

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const shortId = id?.slice(-6).toUpperCase();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto relative overflow-hidden">
        {/* Confetti burst */}
        {confettiEmojis.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.5],
              x: [0, (i % 2 ? 1 : -1) * (40 + i * 15)],
              y: [0, -(60 + i * 20)],
              rotate: [0, (i % 2 ? 1 : -1) * (30 + i * 10)],
            }}
            transition={{ duration: 1.5, delay: 0.3 + i * 0.08, ease: "easeOut" }}
            style={{ top: '30%', left: '50%' }}
          >
            {emoji}
          </motion.span>
        ))}

        {/* Success checkmark with pulse ring */}
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <motion.div
            className="absolute inset-0 w-20 h-20 rounded-full bg-green-400/20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          className="font-display font-bold text-2xl text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Order Placed! 🎉
        </motion.h1>

        <motion.p
          className="text-muted-foreground mt-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your order <span className="font-mono font-bold text-foreground">#{shortId}</span> has been placed successfully.
        </motion.p>

        {/* Points earned animation */}
        <motion.div
          className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-coin/10 border border-coin/20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, delay: 0.8 }}
          >
            <Sparkles className="w-4 h-4 text-coin" />
          </motion.div>
          <span className="text-sm font-semibold text-coin">Points will be credited on completion!</span>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-secondary/50 px-4 py-2.5 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Clock className="w-4 h-4 text-primary" />
          You'll be notified when it's ready for pickup
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 mt-8 w-full"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Link to={`/customer/orders/${id}`} className="flex-1">
            <Button className="w-full gap-2">
              Track Order <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/customer" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
