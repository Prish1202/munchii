
- Merchant types (restaurant/canteen/grocery) share one dashboard; wording comes from src/lib/merchantTerms.ts — avoids duplicate dashboards.
- Grocery preset options live in menu_items.quantity_options; the server prices each order line from order_items.option_label — prevents client price tampering.
