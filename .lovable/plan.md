# Munchii Food-First Customer Experience

## Goal
Refocus the existing customer app on food pre-order, pickup, and 3% Coins while preserving the working Razorpay payment and order lifecycle.

## Customer navigation and routes
- Replace the customer navigation with exactly **Home, Orders, Coins, Profile** on mobile and desktop.
- Remove customer access to Chat, Pulse, Clubs, Connect, Explore, public social profiles, followers, chat settings, privacy/blocking screens, and social profile links.
- Redirect retired customer social URLs to the customer Home screen instead of exposing dead pages.
- Stop loading chat, unread-message, outbox, and username-setup behavior in the active customer experience.
- Keep restaurant, admin, authentication, notification, legal, and payment areas unchanged unless a removed social link appears there.

## Home
- Simplify the first screen around: **“Pre-order. Skip the wait. Earn 3% Coins.”**
- Place restaurant/food search prominently near the top, retain city selection, and show nearby/top restaurants clearly.
- Add concise **Pre-order & Pickup** and Coin balance highlights, including “Earn 3% on every completed order.”
- Keep the existing Munchii orange/royal-blue identity, restaurant imagery, and mobile-first layout while reducing decorative effects and excess motion.

## Restaurant and menu
- Keep the existing Restaurant → Menu journey and cart behavior.
- Add a preparation-time field to menu items, editable by restaurant partners and displayed as `~12 min` on customer menu rows.
- Carry each item’s preparation time into the cart; for old items without a value, use a safe 10-minute default.
- Replace unstable/random restaurant readiness text with preparation-time-based messaging.

## Cart, pickup windows, and checkout
- Add a restaurant preparation buffer setting, defaulting to 5 minutes.
- Calculate earliest pickup from the **longest preparation time in the cart + restaurant buffer**.
- Generate only future 10-minute pickup windows on a 15-minute cadence, for example `10:45–10:55 AM`, `11:00–11:10 AM`, `11:15–11:25 AM`.
- Show the earliest available window and other available windows in the cart, and carry the selected window into checkout.
- Remove arbitrary exact-time entry and `+15/+30` choices from checkout.
- Continue storing the selected window’s start in the existing order pickup-time field so Razorpay and order creation remain intact.
- Show the chosen pickup window consistently in checkout, order success/tracking, and order details.
- Clearly show `+3% Coins` earned after successful completion, based on item total and excluding the ₹4 platform fee.

## Data changes
- Add `preparation_time_minutes` to menu items with validation and a 10-minute default.
- Add `preparation_buffer_minutes` to restaurants with validation and a 5-minute default.
- Regenerate the typed Supabase shape used by the app after the migration.
- Do not delete existing social database data; remove its customer-facing product surface only, avoiding destructive data loss.

## Validation
- Check the new customer Home, menu, cart, checkout, and order-tracking screens at mobile and desktop sizes.
- Verify the longest cart item controls the earliest slot and expired slots disappear.
- Verify the four-item navigation, retired-route redirects, Coin calculation, and existing Razorpay handoff.
- Resolve any build or runtime errors shown by the preview.

## Technical details
- Centralize pickup-window calculation and formatting in a small shared utility to keep cart, checkout, and tracking consistent.
- Persist selected pickup-window state with the cart so refresh/back navigation does not lose the choice.
- Keep the current `orders.pickup_time` contract and existing payment hooks unchanged.
