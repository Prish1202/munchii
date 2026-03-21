import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Ban, Smartphone, Globe, BadgeCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function AccountPrivacy() {
  const navigate = useNavigate();

  const items = [
    {
      icon: Ban,
      label: 'Blocked Users',
      desc: 'Manage users you have blocked',
      action: () => navigate('/customer/blocked-users'),
    },
    {
      icon: Smartphone,
      label: 'Device Permissions',
      desc: 'Camera, microphone, notifications',
      action: () => {
        // Try to open browser settings
        if ('permissions' in navigator) {
          window.open('app-settings:', '_self');
        }
      },
    },
    {
      icon: Globe,
      label: 'Language',
      desc: 'English (Default)',
      action: () => {},
      badge: 'English',
    },
    {
      icon: BadgeCheck,
      label: 'Munchii Verified Badge',
      desc: 'Get a verified badge on your profile',
      action: () => {},
      comingSoon: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/profile/settings')} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Account Privacy</h1>
        </div>

        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Privacy & Access</h3>
          </div>
          {items.map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.comingSoon}
              className={`flex items-center justify-between px-5 py-4 w-full text-left hover:bg-muted/50 transition-colors ${i < items.length - 1 ? 'border-b border-border/50' : ''} ${item.comingSoon ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.comingSoon && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">Coming Soon</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              {item.badge ? (
                <span className="text-xs text-muted-foreground font-medium">{item.badge}</span>
              ) : !item.comingSoon ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : null}
            </button>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
