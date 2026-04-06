
-- Create order_reviews table
CREATE TABLE public.order_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One review per order
CREATE UNIQUE INDEX idx_order_reviews_order_id ON public.order_reviews(order_id);
CREATE INDEX idx_order_reviews_restaurant_id ON public.order_reviews(restaurant_id);

-- Enable RLS
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

-- Customers can insert review for their own completed orders
CREATE POLICY "Customers can create reviews for completed orders"
ON public.order_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id
  AND EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_reviews.order_id
      AND orders.customer_id = auth.uid()
      AND orders.status = 'completed'
  )
);

-- Customers can view their own reviews
CREATE POLICY "Customers can view own reviews"
ON public.order_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Restaurant owners can view reviews for their restaurant
CREATE POLICY "Restaurant owners can view their reviews"
ON public.order_reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = order_reviews.restaurant_id
      AND restaurants.owner_id = auth.uid()
  )
);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.order_reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to get restaurant average rating
CREATE OR REPLACE FUNCTION public.get_restaurant_avg_rating(_restaurant_id UUID)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
    COUNT(*) AS review_count
  FROM order_reviews
  WHERE restaurant_id = _restaurant_id;
$$;
