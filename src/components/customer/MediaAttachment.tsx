import { useRef } from 'react';
import { Paperclip, Image, FileText, Film } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MediaAttachmentProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_FILES_PER_MESSAGE = 10;

export function MediaAttachment({ onFileSelect, onFilesSelect, disabled }: MediaAttachmentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const all = Array.from(list);
    const valid = all.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} is over 200MB and was skipped`);
        return false;
      }
      return true;
    });

    let toSend = valid;
    if (toSend.length > MAX_FILES_PER_MESSAGE) {
      toast.error(`Only the first ${MAX_FILES_PER_MESSAGE} files will be sent`);
      toSend = toSend.slice(0, MAX_FILES_PER_MESSAGE);
    }

    if (toSend.length === 0) {
      e.target.value = '';
      return;
    }

    if (onFilesSelect) {
      onFilesSelect(toSend);
    } else {
      toSend.forEach(onFileSelect);
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
