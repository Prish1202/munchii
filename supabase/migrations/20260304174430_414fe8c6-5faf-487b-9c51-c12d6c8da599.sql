
-- Add profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS campus text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create user_wallet table
CREATE TABLE public.user_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_coins numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.user_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage wallets" ON public.user_wallet FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create coin_transactions table
CREATE TYPE public.coin_type AS ENUM ('earn', 'redeem', 'transfer');

CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  coins numeric NOT NULL,
  type coin_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON public.coin_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view follows" ON public.followers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Allow wallet to be created via trigger
CREATE OR REPLACE FUNCTION public.handle_wallet_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_wallet
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_wallet_creation();

-- Reward coins on order completion (4% of total)
CREATE OR REPLACE FUNCTION public.reward_coins_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coins numeric;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.customer_id IS NOT NULL THEN
    _coins := ROUND(NEW.total_amount * 0.04, 0);
    IF _coins > 0 THEN
      -- Ensure wallet exists
      INSERT INTO public.user_wallet (user_id) VALUES (NEW.customer_id) ON CONFLICT DO NOTHING;
      -- Credit coins
      UPDATE public.user_wallet SET total_coins = total_coins + _coins, updated_at = now() WHERE user_id = NEW.customer_id;
      -- Log transaction
      INSERT INTO public.coin_transactions (user_id, order_id, coins, type) VALUES (NEW.customer_id, NEW.id, _coins, 'earn');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_completed_reward
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.reward_coins_on_completion();

-- Allow users to update own wallet (for redeeming)
CREATE POLICY "Users can update own wallet" ON public.user_wallet FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert coin transactions (for redeem)
CREATE POLICY "Users can insert own transactions" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Public profile viewing policy (allow authenticated users to view any profile for social features)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Drop the restrictive existing view own profile policy since new one is broader
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
