import { useRef, useState, useCallback } from 'react';
import { FileText, Download, X, Maximize2, Loader2, Share2, Forward, Save } from 'lucide-react';
import { cn, resolveStorageUrl } from '@/lib/utils';
import { VoicePlayer } from './VoicePlayer';
import { toast } from 'sonner';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: string;
  fileName?: string;
  isOwn: boolean;
  onForward?: () => void;
}

function inferExtension(mediaType: string, url: string): string {
  const cleanUrl = url.split('?')[0];
  const last = cleanUrl.split('/').pop() || '';
  if (last.includes('.')) {
    const ext = last.split('.').pop();
    if (ext && ext.length <= 5) return ext;
  }
  if (mediaType === 'image') return 'jpg';
  if (mediaType === 'video') return 'mp4';
  if (mediaType === 'voice') return 'webm';
  return 'bin';
}

function buildFileName(mediaType: string, mediaUrl: string, fileName?: string) {
  const ext = inferExtension(mediaType, mediaUrl);
  const defaultName =
    fileName || `munchii-${mediaType || 'file'}-${Date.now()}.${ext}`;
  return defaultName.includes('.') ? defaultName : `${defaultName}.${ext}`;
}

async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    toast.success('Saved');
  } catch (err) {
    console.error('Download failed', err);
    toast.error('Download failed, opening in new tab');
    window.open(url, '_blank');
  }
}

async function shareFile(url: string, filename: string, mediaType: string) {
  // Try Web Share Level 2 (files) first — works on most mobile browsers
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('fetch failed');
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
    const navAny = navigator as any;
    if (navAny.canShare && navAny.canShare({ files: [file] })) {
      await navAny.share({ files: [file], title: filename });
      return;
    }
  } catch (err) {
    console.warn('File share unavailable, falling back to URL share', err);
  }

  // Fallback: share the URL
  try {
    if (navigator.share) {
      await navigator.share({ title: filename, url });
      return;
    }
  } catch {
    // user cancelled — silent
    return;
  }

  // Last resort: copy URL to clipboard
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  } catch {
    toast.error('Sharing not supported on this device');
  }
}

function useLongPress(callback: () => void, ms = 450) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const start = useCallback(() => {
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) callback();
    }, ms);
  }, [callback, ms]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const move = useCallback(() => {
    movedRef.current = true;
    clear();
  }, [clear]);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
    onTouchCancel: clear,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      callback();
    },
  };
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
  onForward?: () => void;
  busy?: boolean;
}

function MediaActionSheet({ open, onClose, onSave, onShare, onForward, busy }: ActionSheetProps) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-black/40 animate-fade-in"
        onClick={onClose}
        onTouchStart={(e) => { e.stopPropagation(); onClose(); }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[130] bg-popover rounded-t-2xl border-t border-border shadow-xl p-3 pb-6 animate-slide-in-right sm:max-w-sm sm:mx-auto sm:bottom-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
        <button
          onClick={onSave}
          disabled={busy}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save to device
        </button>
        <button
          onClick={onShare}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left hover:bg-secondary transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
        {onForward && (
          <button
            onClick={onForward}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left hover:bg-secondary transition-colors"
          >
            <Forward className="w-5 h-5" />
            Forward
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground mt-1"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export function MediaPreview({ mediaUrl, mediaType, fileName, isOwn, onForward }: MediaPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const resolvedUrl = resolveStorageUrl(mediaUrl) || mediaUrl;
  const finalName = buildFileName(mediaType, mediaUrl, fileName);

  const handleDownload = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (downloading) return;
    setDownloading(true);
    await downloadFile(resolvedUrl, finalName);
    setDownloading(false);
    setSheetOpen(false);
  }, [downloading, resolvedUrl, finalName]);

  const handleShare = useCallback(async () => {
    setSheetOpen(false);
    await shareFile(resolvedUrl, finalName, mediaType);
  }, [resolvedUrl, finalName, mediaType]);

  const handleForward = useCallback(() => {
    setSheetOpen(false);
    onForward?.();
  }, [onForward]);

  const longPress = useLongPress(() => {
    if (navigator.vibrate) navigator.vibrate(15);
    setSheetOpen(true);
  });

  if (mediaType === 'voice') {
    return (
      <>
        <div {...longPress}>
          <VoicePlayer src={resolvedUrl} isOwn={isOwn} />
        </div>
        <MediaActionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSave={handleDownload}
          onShare={handleShare}
          onForward={onForward ? handleForward : undefined}
          busy={downloading}
        />
      </>
    );
  }

  if (mediaType === 'image') {
    return (
      <>
        <div className="relative group">
          <div
            className="cursor-pointer"
            onClick={() => setFullscreen(true)}
            {...longPress}
          >
            <img
              src={resolvedUrl}
              alt="Shared image"
              className="rounded-lg max-w-full max-h-[240px] object-cover"
              loading="lazy"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full opacity-90 transition-opacity"
            aria-label="Download image"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        {fullscreen && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="absolute top-4 right-16 p-2 bg-white/10 rounded-full hover:bg-white/20"
              aria-label="Download"
            >
              {downloading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Download className="w-6 h-6 text-white" />
              )}
            </button>
            <img
              src={resolvedUrl}
              alt="Full image"
              className="max-w-[95vw] max-h-[95vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <MediaActionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSave={handleDownload}
          onShare={handleShare}
          onForward={onForward ? handleForward : undefined}
          busy={downloading}
        />
      </>
    );
  }

  if (mediaType === 'video') {
    return (
      <>
        <div className="relative group" {...longPress}>
          <video
            key={resolvedUrl}
            src={resolvedUrl}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              v.muted = false;
              v.volume = 1;
            }}
            className="rounded-lg max-w-full max-h-[280px] bg-black"
          >
            Your browser does not support the video tag.
          </video>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full opacity-90 transition-opacity"
            aria-label="Download video"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <MediaActionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSave={handleDownload}
          onShare={handleShare}
          onForward={onForward ? handleForward : undefined}
          busy={downloading}
        />
      </>
    );
  }

  // File/document
  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer',
          isOwn
            ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
            : 'bg-muted hover:bg-muted/80'
        )}
        onClick={handleDownload}
        role="button"
        {...longPress}
      >
        <FileText className={cn('w-5 h-5 shrink-0', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')} />
        <span className={cn('text-xs truncate max-w-[150px] flex-1', isOwn ? 'text-primary-foreground/80' : 'text-foreground/80')}>
          {fileName || 'Document'}
        </span>
        {downloading ? (
          <Loader2 className={cn('w-4 h-4 shrink-0 animate-spin', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')} />
        ) : (
          <Download className={cn('w-4 h-4 shrink-0', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')} />
        )}
      </div>
      <MediaActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={handleDownload}
        onShare={handleShare}
        onForward={onForward ? handleForward : undefined}
        busy={downloading}
      />
    </>
  );
}
