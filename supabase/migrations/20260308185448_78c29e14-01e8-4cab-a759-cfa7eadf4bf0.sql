
-- Add delivered_at and read_at columns to messages for status indicators
ALTER TABLE public.messages ADD COLUMN delivered_at timestamptz DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN read_at timestamptz DEFAULT NULL;

-- Allow users to update delivered_at/read_at on messages in their conversations (recipient only)
CREATE POLICY "Recipients can mark messages delivered/read"
ON public.messages
FOR UPDATE
USING (
  sender_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
)
WITH CHECK (
  sender_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);
