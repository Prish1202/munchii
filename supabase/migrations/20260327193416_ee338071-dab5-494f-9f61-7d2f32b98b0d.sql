-- Auto-create refund record when an online-paid order is cancelled
CREATE OR REPLACE FUNCTION public.auto_create_refund_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    IF NEW.payment_method != 'cod' THEN
      IF EXISTS (
        SELECT 1 FROM payments
        WHERE order_id = NEW.id
        AND status = 'captured'
      ) THEN
        INSERT INTO refunds (order_id, customer_id, amount, reason, status)
        SELECT NEW.id, NEW.customer_id, NEW.total_amount, 
               'Order cancelled - auto refund', 'pending'
        WHERE NOT EXISTS (
          SELECT 1 FROM refunds WHERE order_id = NEW.id
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_refund_on_cancel ON orders;
CREATE TRIGGER trg_auto_refund_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_refund_on_cancel();