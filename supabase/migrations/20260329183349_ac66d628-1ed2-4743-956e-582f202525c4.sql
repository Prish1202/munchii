-- Functions for block enforcement
create or replace function public.is_blocked_by(_target_user_id uuid, _viewer_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_users bu
    where bu.blocker_id = _target_user_id
      and bu.blocked_id = _viewer_user_id
  );
$$;

create or replace function public.is_blocked_between(_user_a uuid, _user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_users bu
    where (bu.blocker_id = _user_a and bu.blocked_id = _user_b)
       or (bu.blocker_id = _user_b and bu.blocked_id = _user_a)
  );
$$;

-- Tighten profile visibility so users cannot view/search profiles of people who blocked them.
drop policy if exists "Authenticated users can view all profiles" on public.profiles;
create policy "Authenticated users can view visible profiles"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or not public.is_blocked_by(id, auth.uid())
);

-- Lock conversations when either participant has blocked the other.
drop policy if exists "Users can view own conversations" on public.conversations;
create policy "Users can view active conversations"
on public.conversations
for select
to authenticated
using (
  ((auth.uid() = user1_id) or (auth.uid() = user2_id))
  and not public.is_blocked_between(user1_id, user2_id)
);

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
on public.conversations
for insert
to authenticated
with check (
  ((auth.uid() = user1_id) or (auth.uid() = user2_id))
  and not public.is_blocked_between(user1_id, user2_id)
  and exists (
    select 1
    from followers f1
    join followers f2
      on f1.follower_id = f2.following_id
     and f1.following_id = f2.follower_id
    where f1.follower_id = conversations.user1_id
      and f1.following_id = conversations.user2_id
  )
);

-- Lock messages when a block exists in either direction.
drop policy if exists "Users can view messages in their conversations" on public.messages;
create policy "Users can view messages in their conversations"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
);

drop policy if exists "Users can send messages to their conversations" on public.messages;
create policy "Users can send messages to their conversations"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
);

drop policy if exists "Recipients can mark messages delivered/read" on public.messages;
create policy "Recipients can mark messages delivered/read"
on public.messages
for update
to authenticated
using (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
)
with check (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
);

drop policy if exists "Senders can delete their own messages" on public.messages;
create policy "Senders can delete their own messages"
on public.messages
for delete
to authenticated
using (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
);

-- Lock reactions too, so blocked chats are fully disabled.
drop policy if exists "Users can view reactions in their conversations" on public.message_reactions;
create policy "Users can view reactions in their conversations"
on public.message_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_reactions.message_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
);

drop policy if exists "Users can add reactions" on public.message_reactions;
create policy "Users can add reactions"
on public.message_reactions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_reactions.message_id
      and ((c.user1_id = auth.uid()) or (c.user2_id = auth.uid()))
      and not public.is_blocked_between(c.user1_id, c.user2_id)
  )
);

-- Ensure refund records are created when a paid order is cancelled.
create or replace function public.auto_create_refund_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    if coalesce(lower(new.payment_method), 'cod') <> 'cod' then
      if exists (
        select 1
        from public.payments
        where order_id = new.id
          and status = 'captured'
      ) then
        insert into public.refunds (order_id, customer_id, amount, reason, status)
        select new.id,
               new.customer_id,
               new.total_amount,
               'Order cancelled - auto refund',
               'pending'
        where new.customer_id is not null
          and not exists (
            select 1
            from public.refunds r
            where r.order_id = new.id
          );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_create_refund_on_cancel on public.orders;
create trigger trg_auto_create_refund_on_cancel
after update on public.orders
for each row
execute function public.auto_create_refund_on_cancel();