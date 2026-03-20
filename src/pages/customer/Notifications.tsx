import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNotifications, useMarkNotificationRead, useMarkAllRead, Notification } from '@/hooks/useNotifications';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ShoppingBag, UserPlus, AlertCircle, TrendingUp, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="w-4 h-4 text-primary" />,
  social: <UserPlus className="w-4 h-4 text-secondary" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
  earning: <TrendingUp className="w-4 h-4 text-primary" />,
  info: <Bell className="w-4 h-4 text-muted-foreground" />,
};

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();

  const handleClick = () => {
    if (!notification.read) markRead.mutate(notification.id);
  };

  const content = (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-xl transition-colors cursor-pointer border',
        notification.read
          ? 'opacity-60 border-border'
          : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {TYPE_ICONS[notification.type] || TYPE_ICONS.info}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link to={notification.link} onClick={handleClick}>{content}</Link>;
  }
  return content;
}

export default function Notifications() {
  const { data: notifications, isLoading, unreadCount } = useNotifications();
  const markAll = useMarkAllRead();

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl">Notifications</h1>
            <Link to="/customer/notification-settings" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Settings className="w-4.5 h-4.5 text-muted-foreground" />
            </Link>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAll.mutate()}
              className="text-xs text-primary font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !notifications?.length ? (
          <div className="text-center py-16 space-y-3">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No notifications yet</p>
            <p className="text-muted-foreground text-xs">You'll be notified about orders, messages, and more</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
