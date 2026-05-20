import { get, set, del, keys } from 'idb-keyval';

export interface OutboxMessage {
  id: string; // optimistic id
  conversationId: string;
  recipientUserId: string;
  senderId: string;
  plaintext: string;
  replyToId: string | null;
  createdAt: string;
  attempts: number;
}

const PREFIX = 'chat-outbox:';
const key = (id: string) => `${PREFIX}${id}`;

export async function enqueueOutbox(msg: OutboxMessage) {
  await set(key(msg.id), msg);
}

export async function removeOutbox(id: string) {
  await del(key(id));
}

export async function listOutbox(): Promise<OutboxMessage[]> {
  const allKeys = await keys();
  const outboxKeys = allKeys.filter((k) => typeof k === 'string' && (k as string).startsWith(PREFIX)) as string[];
  const items = await Promise.all(outboxKeys.map((k) => get<OutboxMessage>(k)));
  return items.filter(Boolean).sort((a, b) => a!.createdAt.localeCompare(b!.createdAt)) as OutboxMessage[];
}

export async function listOutboxForConversation(conversationId: string) {
  const all = await listOutbox();
  return all.filter((m) => m.conversationId === conversationId);
}

export async function incrementAttempts(id: string) {
  const item = await get<OutboxMessage>(key(id));
  if (item) {
    item.attempts += 1;
    await set(key(id), item);
  }
}
