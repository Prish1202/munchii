import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ShoppingBag, UserPlus, AlertCircle, TrendingUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useMarkNotificationRead, useMarkAllRead, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="w-4 h-4 text-primary" />,
  social: <UserPlus className="w-4 h-4 text-social" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
  earning: <TrendingUp className="w-4 h-4 text-coin" />,
  info: <Bell className="w-4 h-4 text-muted-foreground" />,
};

function NotificationItem({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();

  const handleClick = () => {
    if (!notification.read) markRead.mutate(notification.id);
  };

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-xl transition-colors cursor-pointer',
        notification.read ? 'opacity-60' : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        {TYPE_ICONS[notification.type] || TYPE_ICONS.info}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link to={notification.link} onClick={handleClick}>{content}</Link>;
  }
  return content;
}

export function NotificationBell() {
  const { data: notifications, unreadCount } = useNotifications();
  const markAll = useMarkAllRead();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4.5 w-4.5 p-0 flex items-center justify-center text-[10px] gradient-primary border-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-sm">Notifications</h3>
            <Link to="/customer/notification-settings" className="p-1 rounded-md hover:bg-muted transition-colors">
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {!notifications?.length ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {notifications.slice(0, 10).map(n => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications && notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Link
              to="/customer/notifications"
              className="block text-center text-xs font-medium text-primary hover:underline py-1"
            >
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
