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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function compressVideo(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    // Do NOT mute — we need audio for capture
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = 0;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const canvasStream = canvas.captureStream(24);

      // Capture audio from the video element
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        // Also connect to speakers so the element plays (muted visually but captured)
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
      } catch {
        // No audio track or unsupported — continue without audio
      }

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : 'video/webm',
        videoBitsPerSecond: 1_500_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webm'), { type: 'video/webm' });
        resolve(compressed.size < file.size ? compressed : file);
      };
      recorder.onerror = () => { URL.revokeObjectURL(url); reject(new Error('compress failed')); };

      recorder.start();
      const ctx = canvas.getContext('2d')!;
      // Mute the video element's audio output to prevent hearing it
      video.volume = 0;
      video.play();

      const draw = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(draw);
      };
      draw();

      video.onended = () => recorder.state === 'recording' && recorder.stop();
    };

    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('video load failed')); };
  });
}

export function MediaAttachment({ onFileSelect, disabled }: MediaAttachmentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be under 50MB');
      return;
    }

    // Compress video if it's a video file and > 10MB
    if (file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
      try {
        const compressed = await compressVideo(file);
        onFileSelect(compressed);
      } catch {
        onFileSelect(file); // fallback to original
      }
    } else {
      onFileSelect(file);
    }
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
