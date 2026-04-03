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
  disabled?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function MediaAttachment({ onFileSelect, disabled }: MediaAttachmentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be under 20MB');
      return;
    }
    onFileSelect(file);
    e.target.value = '';
  };

  return (
    <>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
      
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
            <Image className="w-4 h-4" /> Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInputRef.current?.click()} className="gap-2">
            <Film className="w-4 h-4" /> Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
            <FileText className="w-4 h-4" /> Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
