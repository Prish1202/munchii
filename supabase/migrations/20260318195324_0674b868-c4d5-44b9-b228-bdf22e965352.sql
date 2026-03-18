CREATE POLICY "Senders can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);