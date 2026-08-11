import { useRef } from 'react';
import { Paperclip, Image, FileText, Film } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface MediaAttachmentProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  disabled?: boolean;
}

export function MediaAttachment({ onFileSelect, onFilesSelect, disabled }: MediaAttachmentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const files = Array.from(list);

    if (files.length === 0) {
      e.target.value = '';
      return;
    }

    if (onFilesSelect) {
      onFilesSelect(files);
    } else {
      files.forEach(onFileSelect);
    }
    e.target.value = '';
  };

  return (
    <>
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFiles} />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-9 w-9 rounded-xl"
            disabled={disabled}
            title="Attach media"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          <DropdownMenuItem onClick={() => imageInputRef.current?.click()} className="gap-2">
            <Image className="w-4 h-4" /> Photo (view once)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInputRef.current?.click()} className="gap-2">
            <Film className="w-4 h-4" /> Video (view once, 60s)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
            <FileText className="w-4 h-4" /> Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
