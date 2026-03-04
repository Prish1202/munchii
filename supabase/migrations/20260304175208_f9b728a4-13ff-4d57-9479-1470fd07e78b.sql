
-- User public keys for E2EE
CREATE TABLE public.user_public_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_public_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view public keys" ON public.user_public_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upsert own key" ON public.user_public_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own key" ON public.user_public_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id < user2_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user1_id OR auth.uid() = user2_id)
    AND EXISTS (
      SELECT 1 FROM public.followers f1
      JOIN public.followers f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = conversations.user1_id AND f1.following_id = conversations.user2_id
    )
  );

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ));
CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Coin transfer rate limiting table
CREATE TABLE public.transfer_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transfer_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transfer_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON public.transfer_rate_limits FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Atomic transfer function to prevent race conditions
CREATE OR REPLACE FUNCTION public.transfer_coins(
  _sender_id uuid,
  _recipient_id uuid,
  _coins numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Lock sender row to prevent double-spend
  PERFORM 1 FROM user_wallet WHERE user_id = _sender_id FOR UPDATE;
  
  -- Verify balance
  IF (SELECT total_coins FROM user_wallet WHERE user_id = _sender_id) < _coins THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct from sender
  UPDATE user_wallet SET total_coins = total_coins - _coins, updated_at = now() WHERE user_id = _sender_id;
  
  -- Ensure recipient wallet
  INSERT INTO user_wallet (user_id, total_coins) VALUES (_recipient_id, 0) ON CONFLICT (user_id) DO NOTHING;
  
  -- Credit recipient
  UPDATE user_wallet SET total_coins = total_coins + _coins, updated_at = now() WHERE user_id = _recipient_id;
  
  -- Verify no negative balance
  IF (SELECT total_coins FROM user_wallet WHERE user_id = _sender_id) < 0 THEN
    RAISE EXCEPTION 'Double spend detected';
  END IF;
END;
$$;

-- Add realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
