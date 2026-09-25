# Munchii: 3 merchant types (Restaurant/Café, Campus Canteen, Grocery)

## What you'll see
- **Merchant sign-up** starts with one choice: Restaurant / Café, In-campus Canteen, or Grocery / Daily Needs. The rest of the steps adapt:
  - Restaurant and Canteen: FSSAI licence and GST (as today). Canteen also asks for the college name.
  - Grocery: shop licence / GST and store category. No FSSAI or kitchen fields are forced.
- **One Merchant Dashboard** with words and features that change by type:
  - Restaurant/Canteen: Menu, prep time per item, Kitchen queue, Preparing → Ready → Picked Up, pickup slots, rush pause (all unchanged).
  - Grocery: Products, Picking/Packing → Ready → Picked Up, product availability, quantity and fulfilment options. Pickup slots, capacity and pause stay available.
- **Product options for grocery**: fixed pack, weight (250g / 500g / 1kg), per unit, or by price (e.g. ₹20 coriander). Customers pick one of the preset options before paying; no weight adjustments after payment.
- **Customer Home** becomes category-first: three big tiles (Food, Campus, Grocery). Choosing one shows nearby merchants of that type only. Search and city work inside the chosen category.
- Pre-order → pickup slot → payment → tracking → 3% Coins stays exactly the same for all three.

## Safety
- Every existing restaurant becomes "Restaurant / Café" automatically; existing menus and orders keep working.
- Existing items default to fixed quantity and "prepare" fulfilment.
- No new apps, no duplicate dashboards, no changes to payments, Coins, or slot rules.

## Technical details
- Migration:
  - enum `merchant_type` (restaurant, canteen, grocery); `restaurants.merchant_type` NOT NULL default 'restaurant'.
  - enums `fulfillment_type` (READY_TO_PICK, PICK_AND_PACK, WEIGH_AND_PACK, PREPARE) and `quantity_type` (FIXED, WEIGHT, UNIT, PRICE) on `menu_items`, defaults PREPARE/FIXED; `menu_items.quantity_options jsonb` (e.g. `[{label:"500g", price:40}]`).
  - `order_items.option_label text` nullable; `secure_order_item_insert` / `recalc_order_total` extended to price from the matching option server-side (falls back to item price).
  - `restaurant_compliance` gets `shop_license text`, `store_category text`.
- `src/lib/merchantTerms.ts`: one terminology map (Menu/Products, Kitchen queue/Packing queue, Preparing/Packing) used by DashboardLayout nav, Orders, MenuManagement, Onboarding.
- Onboarding: new first step for type; conditional compliance step.
- MenuManagement: fulfilment/quantity selectors and preset options editor for grocery; prep time hidden when not PREPARE/WEIGH_AND_PACK.
- Customer: `useRestaurants(city, merchantType)`; Dashboard category tiles, saved in localStorage; RestaurantMenu shows option picker; CartContext keys items by item+option.
- Pickup slot prep = longest prep among PREPARE/pack items (ready-to-pick counts as 0) + buffer.
