-- Allow users to insert their own role during signup (only for customer, restaurant, delivery - not admin)
CREATE POLICY "Users can insert own role on signup" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('customer', 'restaurant', 'delivery')
);