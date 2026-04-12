
-- Trigger on notifications table: fires push for every new notification row
CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();

-- Trigger on messages: creates a notification for the recipient of a new chat message
CREATE OR REPLACE FUNCTION public.notify_new_message()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _recipient_id uuid;
  _sender_name text;
BEGIN
  -- Find the other user in the conversation
  SELECT CASE
    WHEN c.user1_id = NEW.sender_id THEN c.user2_id
    ELSE c.user1_id
  END INTO _recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  IF _recipient_id IS NULL THEN RETURN NEW; END IF;

  -- Check if recipient has message notifications enabled
  IF EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = _recipient_id AND message_notifications = false
  ) THEN
    RETURN NEW;
  END IF;

  SELECT name INTO _sender_name FROM profiles WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    _recipient_id,
    'New Message',
    COALESCE(_sender_name, 'Someone') || ' sent you a message',
    'message',
    '/customer/messages'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- Trigger on coin_transactions: notifies user of coin activity
CREATE OR REPLACE FUNCTION public.notify_coin_activity()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _title text;
  _msg text;
BEGIN
  -- Check if user has earning notifications enabled
  IF EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = NEW.user_id AND earning_notifications = false
  ) THEN
    RETURN NEW;
  END IF;

  CASE NEW.type
    WHEN 'earn' THEN
      _title := 'Points Earned!';
      _msg := 'You earned ' || NEW.coins::text || ' points.';
    WHEN 'redeem' THEN
      _title := 'Points Redeemed';
      _msg := 'You redeemed ' || NEW.coins::text || ' points.';
    WHEN 'transfer' THEN
      _title := 'Coin Transfer';
      _msg := NEW.coins::text || ' points transferred.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (NEW.user_id, _title, _msg, 'earning', '/customer/coins');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_coin_activity
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_coin_activity();

-- Triggers on orders: the existing notify_new_order and notify_order_status_change
-- functions exist but have no triggers attached. Re-create them.
CREATE TRIGGER trg_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'placed')
  EXECUTE FUNCTION public.notify_new_order();

CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_status_change();

-- Re-attach the existing reward + auto-complete triggers that were missing
CREATE TRIGGER trg_reward_coins
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_coins_on_completion();

CREATE TRIGGER trg_auto_complete_pickup
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_on_pickup();

CREATE TRIGGER trg_auto_refund_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_refund_on_cancel();

-- Follower notification trigger
CREATE TRIGGER trg_notify_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

-- Wallet creation trigger on profiles
CREATE TRIGGER trg_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_wallet_creation();
