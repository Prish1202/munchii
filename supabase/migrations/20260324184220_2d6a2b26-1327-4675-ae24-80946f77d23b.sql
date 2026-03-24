DROP POLICY IF EXISTS "Customers can cancel own placed orders" ON public.orders;
CREATE POLICY "Customers can cancel own placed orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = customer_id 
    AND status IN ('placed'::order_status, 'pending_payment'::order_status)
  )
  WITH CHECK (
    auth.uid() = customer_id 
    AND status = 'cancelled'::order_status
  );