import { useOutboxFlusher } from '@/hooks/useOutboxFlusher';

export function OutboxFlusher() {
  useOutboxFlusher();
  return null;
}
