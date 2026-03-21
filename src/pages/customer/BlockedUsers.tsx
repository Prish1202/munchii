import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BlockedUsers() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/account-privacy')} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Blocked Users</h1>
        </div>

        <motion.div
          className="bg-card rounded-2xl border border-border p-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-base mb-1">No Blocked Users</h3>
          <p className="text-sm text-muted-foreground">
            When you block someone from their profile or chat, they'll appear here.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
