# Munchii merchant workspace redesign

## What will change
- Replace merchant navigation with **Home, Orders, Menu/Products, More** on mobile and the same four destinations on desktop.
- Keep one shared interface; labels adapt from `merchant_type`:
  - Restaurant/Canteen: Menu, Preparing
  - Grocery: Products, Picking & Packing
- Remove earnings and payout panels from Home and place them under **More → Earnings & Payouts**.

## Home
- Lead with the business name, current accepting/paused status, and a prominent pause/reopen control using the existing pause logic.
- Show a focused action feed for New Orders, Upcoming Pickups, Preparing/Picking & Packing, and Ready.
- Show only a compact today summary for order count and sales.
- Link each queue to the Orders workspace without changing order data or status behavior.

## Orders
- Restructure the existing paid-order workspace into clear stages: **New → Preparing/Picking & Packing → Upcoming → Ready → Completed**.
- Make pickup time and items easy to scan.
- Give each order one visually dominant next action while retaining existing rejection, OTP handover, and detail access.
- Preserve realtime refresh, payment filtering, pickup timing, status updates, and notification sounds.

## Menu / Products
- Keep all existing item CRUD, availability, categories, images, prices, discounts, and server-backed option behavior.
- Surface availability and prep time clearly for Restaurant/Canteen.
- Surface quantity and fulfilment type clearly for Grocery.
- Update merchant-specific wording consistently without splitting the page.

## More and settings
- Add a **More** destination with grouped entries: Earnings & Payouts, Business, Ordering & Pickup, Payments & Payouts, Notifications, Account, Help.
- Reorganize the existing long settings screen into those sections without removing controls.
- Keep common pickup controls visible; place max prep workload, minimum advance time, and maximum advance booking under a collapsed **Advanced** section.

## Visual direction
- Use the selected Munchii blue palette with orange reserved for attention and urgent order actions.
- Use friendly, direct typography and a compact single-column feed on mobile.
- Reduce decorative cards and oversized metrics; prioritize clear headings, status bands, compact rows, and large touch targets.
- Preserve dark mode and existing semantic color tokens.

## Safety and verification
- Frontend presentation and navigation only; no migrations, payment changes, order rules, pickup-capacity calculations, or server logic changes.
- Verify the code check, current preview diagnostics, public signed-out behavior, and responsive merchant layouts where authentication permits.
- Explicitly exclude teams, staffing, shifts, rosters, and delivery features.
