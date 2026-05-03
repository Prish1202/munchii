import { Loader2, X, RotateCw, AlertCircle, CheckCircle2, Image as ImageIcon, Film, FileText } from 'lucide-react';
import { ChatUploadItem } from '@/hooks/useChatUploads';
import { cn } from '@/lib/utils';

interface ChatUploadsListProps {
  items: ChatUploadItem[];
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
}

function iconFor(type: ChatUploadItem['mediaType']) {
  if (type === 'image') return ImageIcon;
  if (type === 'video') return Film;
  return FileText;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatUploadsList({ items, onRetry, onCancel, onDismiss }: ChatUploadsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-3 pt-2 pb-1 space-y-1.5 border-t border-border bg-card/60 backdrop-blur-sm max-h-[40vh] overflow-y-auto">
      {items.map((item) => {
        const Icon = iconFor(item.mediaType);
        const isError = item.status === 'error';
        const isSuccess = item.status === 'success';
        const isActive = item.status === 'uploading' || item.status === 'pending';

        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs',
              isError
                ? 'bg-destructive/10 border-destructive/30'
                : isSuccess
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-muted/40 border-border'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                isError
                  ? 'bg-destructive/20 text-destructive'
                  : isSuccess
                  ? 'bg-green-500/20 text-green-600'
                  : 'bg-primary/15 text-primary'
              )}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-foreground/90">
                  {item.file.name}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {isActive
                    ? `${item.progress}%`
                    : isError
                    ? 'Failed'
                    : isSuccess
                    ? 'Sent'
                    : formatSize(item.file.size)}
                </span>
              </div>

              {isActive && (
                <div className="mt-1 h-1 rounded-full bg-primary/15 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {isError && item.error && (
                <p className="mt-0.5 text-[10px] text-destructive truncate">
                  {item.error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {isActive && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary mr-1" />
                  <button
                    onClick={() => onCancel(item.id)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    aria-label="Cancel upload"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {isError && (
                <>
                  <button
                    onClick={() => onRetry(item.id)}
                    className="p-1 rounded-md hover:bg-destructive/15 text-destructive"
                    aria-label="Retry upload"
                    title="Retry"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDismiss(item.id)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
