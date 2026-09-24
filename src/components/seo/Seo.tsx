import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_URL = 'https://munchii.in';
const DEFAULT_TITLE = 'Munchii — Pre-order & Pickup Food, Earn 3% Coins';
const DEFAULT_DESC =
  'Pre-order food from nearby restaurants, pick a pickup window, skip the queue and earn 3% Coins on every completed order.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applySeo(opts: { title: string; description: string; path: string; jsonLd?: object | null }) {
  const url = `${SITE_URL}${opts.path === '/' ? '/' : opts.path}`;
  document.title = opts.title;
  setMeta('name', 'description', opts.description);
  setMeta('property', 'og:title', opts.title);
  setMeta('property', 'og:description', opts.description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', opts.title);
  setMeta('name', 'twitter:description', opts.description);
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
  document.head.querySelectorAll('script[data-seo-jsonld]').forEach((s) => s.remove());
  if (opts.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-seo-jsonld', 'true');
    s.textContent = JSON.stringify(opts.jsonLd);
    document.head.appendChild(s);
  }
}

const ROUTES: Record<string, [string, string]> = {
  '/': [DEFAULT_TITLE, DEFAULT_DESC],
  '/home': ['Munchii — Skip the Queue, Pre-order Your Food', DEFAULT_DESC],
  '/login': ['Log in — Munchii', 'Log in to Munchii as a Foodie or restaurant partner to pre-order food and manage pickups.'],
  '/signup': ['Sign up as a Foodie — Munchii', 'Create a free Munchii account to pre-order food, skip the wait and earn 3% Coins.'],
  '/signup/customer': ['Sign up as a Foodie — Munchii', 'Create a free Munchii account to pre-order food, skip the wait and earn 3% Coins.'],
  '/signup/restaurant': ['Become a Restaurant Partner — Munchii', 'List your restaurant on Munchii and receive paid pre-orders with scheduled pickup windows.'],
  '/forgot-password': ['Reset your password — Munchii', 'Reset your Munchii account password.'],
  '/terms': ['Terms of Service — Munchii', 'The terms that govern using Munchii for food pre-orders and pickup.'],
  '/privacy': ['Privacy Policy — Munchii', 'How Munchii collects, uses and protects your personal data.'],
  '/community-guidelines': ['Community Guidelines — Munchii', 'Rules for respectful and safe use of Munchii.'],
  '/cancellation-refund': ['Cancellation & Refund Policy — Munchii', 'How order cancellations and refunds work on Munchii.'],
  '/about': ['About Us — Munchii', 'Munchii helps you pre-order food from nearby restaurants and pick it up without waiting.'],
  '/contact': ['Contact Us — Munchii', 'Get in touch with the Munchii team for support, partnerships or grievances.'],
  '/customer': ['Home — Munchii', 'Discover nearby restaurants, pre-order and earn 3% Coins.'],
  '/customer/browse': ['Explore Restaurants — Munchii', 'Browse nearby restaurants and their menus to pre-order for pickup.'],
  '/customer/orders': ['My Orders — Munchii', 'Track your current and past Munchii pickup orders.'],
  '/customer/coins': ['My Coins — Munchii', 'See your Munchii Coins balance and history.'],
};

/** Sets per-route title/description/canonical/og:url. Pages with their own data (restaurant menus) override. */
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/customer/restaurant/')) return;
    const [title, description] = ROUTES[pathname] ?? [DEFAULT_TITLE, DEFAULT_DESC];
    applySeo({ title, description, path: pathname });
  }, [pathname]);
  return null;
}
