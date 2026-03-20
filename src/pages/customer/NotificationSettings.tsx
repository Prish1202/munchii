import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Switch } from '@/components/ui/switch';
import { Bell, ShoppingBag, UserPlus, TrendingUp, MessageSquare, Volume2, Vibrate, Smartphone, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}

function SettingRow({ icon, title, description, checked, onToggle }: SettingRowProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

export default function NotificationSettings() {
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();

  const toggle = (key: string) => (value: boolean) => {
    updatePreference.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/customer/notifications" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display font-bold text-2xl">Notification Settings</h1>
        </div>

        {/* Notification Types */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Notification Types</p>
          <SettingRow
            icon={<ShoppingBag className="w-4 h-4 text-primary" />}
            title="Order Updates"
            description="Get notified about order status changes"
            checked={preferences.order_notifications}
            onToggle={toggle('order_notifications')}
          />
          <SettingRow
            icon={<UserPlus className="w-4 h-4 text-secondary" />}
            title="Social Activity"
            description="New followers and social interactions"
            checked={preferences.social_notifications}
            onToggle={toggle('social_notifications')}
          />
          <SettingRow
            icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
            title="Messages"
            description="New chat messages from friends"
            checked={preferences.message_notifications}
            onToggle={toggle('message_notifications')}
          />
          <SettingRow
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            title="Earnings & Coins"
            description="Coin rewards and transaction updates"
            checked={preferences.earning_notifications}
            onToggle={toggle('earning_notifications')}
          />
        </div>

        {/* Delivery Methods */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Delivery Methods</p>
          <SettingRow
            icon={<Smartphone className="w-4 h-4 text-primary" />}
            title="Browser Push"
            description="Show native browser notifications"
            checked={preferences.push_notifications}
            onToggle={toggle('push_notifications')}
          />
          <SettingRow
            icon={<Volume2 className="w-4 h-4 text-primary" />}
            title="Sound"
            description="Play a sound for new notifications"
            checked={preferences.sound_enabled}
            onToggle={toggle('sound_enabled')}
          />
          <SettingRow
            icon={<Vibrate className="w-4 h-4 text-primary" />}
            title="Vibration"
            description="Vibrate on new notifications (mobile)"
            checked={preferences.vibration_enabled}
            onToggle={toggle('vibration_enabled')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
