-- 1. Create menu_categories table
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.menu_categories
  FOR SELECT USING (true);

CREATE POLICY "Restaurant owners can manage categories" ON public.menu_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_categories.restaurant_id AND restaurants.owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all categories" ON public.menu_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add category_id to menu_items
ALTER TABLE public.menu_items ADD COLUMN category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL;

-- 3. Add payout tracking columns to payouts table
ALTER TABLE public.payouts ADD COLUMN payout_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.payouts ADD COLUMN payout_notes text;
ALTER TABLE public.payouts ADD COLUMN processed_at timestamptz;