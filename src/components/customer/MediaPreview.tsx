import { useState } from 'react';
import { FileText, Download, X, Maximize2, Loader2 } from 'lucide-react';
import { cn, resolveStorageUrl } from '@/lib/utils';
import { VoicePlayer } from './VoicePlayer';
import { toast } from 'sonner';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: string;
  fileName?: string;
  isOwn: boolean;
}

function inferExtension(mediaType: string, url: string): string {
  // Try to read extension from the URL/path
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
    toast.success('Downloaded');
  } catch (err) {
    console.error('Download failed', err);
    toast.error('Download failed, opening in new tab');
    window.open(url, '_blank');
  }
}

export function MediaPreview({ mediaUrl, mediaType, fileName, isOwn }: MediaPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const resolvedUrl = resolveStorageUrl(mediaUrl) || mediaUrl;

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (downloading) return;
    setDownloading(true);
    const ext = inferExtension(mediaType, mediaUrl);
    const defaultName =
      fileName ||
      `munchii-${mediaType || 'file'}-${Date.now()}.${ext}`;
    const finalName = defaultName.includes('.') ? defaultName : `${defaultName}.${ext}`;
    await downloadFile(resolvedUrl, finalName);
    setDownloading(false);
  };

  if (mediaType === 'voice') {
    return <VoicePlayer src={resolvedUrl} isOwn={isOwn} />;
  }

  if (mediaType === 'image') {
    return (
      <>
        <div className="relative group">
          <div className="cursor-pointer" onClick={() => setFullscreen(true)}>
            <img
              src={resolvedUrl}
              alt="Shared image"
              className="rounded-lg max-w-full max-h-[240px] object-cover"
              loading="lazy"
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
      </>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="relative group">
        <video
          key={resolvedUrl}
          src={resolvedUrl}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
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
    );
  }

  // File/document
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer',
        isOwn
          ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
          : 'bg-muted hover:bg-muted/80'
      )}
      onClick={handleDownload}
      role="button"
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
  );
}
