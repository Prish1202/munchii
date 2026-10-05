import { Link } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Wallet,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { merchantTerms } from '@/lib/merchantTerms';
import { useMyRestaurant } from '@/hooks/useMenuManagement';

const groups = [
  {
    label: 'Money',
    items: [
      { title: 'Earnings & Payouts', description: 'Sales, settlements and payout history', href: '/restaurant/payouts', icon: Wallet },
      { title: 'Payments & Payouts', description: 'Accepted payments and settlement information', href: '/restaurant/settings#payments', icon: CreditCard },
    ],
  },
  {
    label: 'Manage',
    items: [
      { title: 'Business', description: 'Outlet details, photo and visibility', href: '/restaurant/settings#business', icon: Building2 },
      { title: 'Ordering & Pickup', description: 'Pickup slots, capacity and advanced controls', href: '/restaurant/settings#ordering', icon: SlidersHorizontal },
      { title: 'Notifications', description: 'Order alerts, sound and vibration', href: '/restaurant/notification-settings', icon: Bell },
    ],
  },
  {
    label: 'Support',
    items: [
      { title: 'Account', description: 'Appearance and sign out', href: '/restaurant/settings#account', icon: UserRound },
      { title: 'Help', description: 'Contact Munchii support', href: '/contact', icon: CircleHelp },
    ],
  },
];

export default function RestaurantMore() {
  const { data: restaurant } = useMyRestaurant();
  const terms = merchantTerms((restaurant as any)?.merchant_type);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-7 pb-24 md:pb-8">
        <header className="space-y-1">
          <p className="text-sm font-semibold text-primary">{terms.business} tools</p>
          <h1 className="text-2xl font-bold">More</h1>
          <p className="text-sm text-muted-foreground">Money, business settings and support in one place.</p>
        </header>

        {groups.map((group) => (
          <section key={group.label} className="space-y-2">
            <h2 className="px-1 text-xs font-bold uppercase text-muted-foreground">{group.label}</h2>
            <div className="overflow-hidden rounded-lg border bg-card">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className={`flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 ${index > 0 ? 'border-t' : ''}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          Your order and payment controls remain protected by Munchii.
        </div>
      </div>
    </DashboardLayout>
  );
}