import { useState } from 'react';
import { FileText, Download, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoicePlayer } from './VoicePlayer';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: string;
  fileName?: string;
  isOwn: boolean;
}

export function MediaPreview({ mediaUrl, mediaType, fileName, isOwn }: MediaPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);

  if (mediaType === 'voice') {
    return <VoicePlayer src={mediaUrl} isOwn={isOwn} />;
  }

  if (mediaType === 'image') {
    return (
      <>
        <div className="relative group cursor-pointer" onClick={() => setFullscreen(true)}>
          <img
            src={mediaUrl}
            alt="Shared image"
            className="rounded-lg max-w-full max-h-[240px] object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        </div>
        {fullscreen && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={mediaUrl}
              alt="Full image"
              className="max-w-[95vw] max-h-[95vh] object-contain"
            />
          </div>
        )}
      </>
    );
  }

  if (mediaType === 'video') {
    return (
      <video
        src={mediaUrl}
        controls
        className="rounded-lg max-w-full max-h-[240px]"
        preload="metadata"
      />
    );
  }

  // File/document
  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
        isOwn
          ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
          : 'bg-muted hover:bg-muted/80'
      )}
    >
      <FileText className={cn('w-5 h-5 shrink-0', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')} />
      <span className={cn('text-xs truncate max-w-[150px]', isOwn ? 'text-primary-foreground/80' : 'text-foreground/80')}>
        {fileName || 'Document'}
      </span>
      <Download className={cn('w-4 h-4 shrink-0', isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground/50')} />
    </a>
  );
}
