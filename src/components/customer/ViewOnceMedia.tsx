import { useState, useCallback, useEffect, useRef } from 'react';
import { Eye, EyeOff, Loader2, ShieldAlert, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { decryptMediaToBlob } from '@/lib/mediaCrypto';
import { resolveStorageUrl } from '@/lib/utils';
import { enableSecureWindow, disableSecureWindow, isSecureWindowSupported } from '@/lib/secureWindow';
import { toast } from 'sonner';

interface ViewOnceMediaProps {
  messageId: string;
  isOwn: boolean;
  mediaType: string;
  viewedAt?: string | null;
  available: boolean;
}

const label = (mediaType: string) => (mediaType === 'video' ? 'Video' : 'Photo');

export function ViewOnceMedia({ messageId, isOwn, mediaType, viewedAt, available }: ViewOnceMediaProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const purgeLocalCopy = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  useEffect(() => () => purgeLocalCopy(), [purgeLocalCopy]);

  const close = useCallback(async () => {
    purgeLocalCopy();
    disableSecureWindow();
    // Server-side purge: queues the encrypted B2 object for deletion and clears metadata.
    await supabase.rpc('finalize_view_once_media', { _message_id: messageId });
  }, [messageId, purgeLocalCopy]);

  const open = useCallback(async () => {
    if (!user?.id || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_view_once_media', { _message_id: messageId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.file_path || !row?.media_key || !row?.media_iv) {
        throw new Error('This media is no longer available');
      }

      const res = await fetch(resolveStorageUrl(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/b2-signed-url?filePath=${encodeURIComponent(row.file_path)}`));
      if (!res.ok) throw new Error('Could not load media');
      const cipher = await res.arrayBuffer();

      const contentType = row.media_type === 'video' ? 'video/mp4' : 'image/jpeg';
      const blob = await decryptMediaToBlob(cipher, row.media_key, row.media_iv, user.id, contentType);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setBlobUrl(url);
      setOpened(true);
      await enableSecureWindow();
    } catch (err: any) {
      toast.error(err?.message || 'This media is no longer available');
      setOpened(true);
    } finally {
      setLoading(false);
    }
  }, [messageId, user?.id, loading]);

  const expired = !available || (!isOwn && !!viewedAt) || opened;

  return (
    <>
      <button
        type="button"
        onClick={isOwn || expired ? undefined : open}
        disabled={isOwn || expired || loading}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-left w-[220px] disabled:opacity-70"
      >
        <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : expired ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium truncate">
            {label(mediaType)} · View once
          </span>
          <span className="block text-[11px] text-muted-foreground truncate">
            {isOwn
              ? viewedAt ? 'Opened' : 'Sent'
              : expired
              ? 'Opened'
              : 'Tap to view once'}
          </span>
        </span>
      </button>

      {blobUrl && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {mediaType === 'video' ? (
            <video
              src={blobUrl}
              className="max-h-full max-w-full"
              autoPlay
              controls
              playsInline
              controlsList="nodownload"
              onEnded={close}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <img
              src={blobUrl}
              alt="View once media"
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          <p className="absolute bottom-4 left-0 right-0 px-6 text-center text-[11px] text-white/70 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            {isSecureWindowSupported()
              ? 'Screenshot protection enabled on this device.'
              : 'Screenshots can’t be blocked on this platform.'}
          </p>
        </div>
      )}
    </>
  );
}
