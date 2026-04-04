import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const mimeTypeRef = useRef('audio/webm');

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const finishRecording = useCallback((discard = false) => {
    discardRecordingRef.current = discard;
    clearTimers();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopStream();
      setDuration(0);
    }

    setIsRecording(false);
  }, [clearTimers, stopStream]);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const supportedMimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      mimeTypeRef.current = mediaRecorder.mimeType || supportedMimeType || 'audio/webm';

      chunksRef.current = [];
      discardRecordingRef.current = false;
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: chunksRef.current[0]?.type || mimeTypeRef.current,
        });
        const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
        stopStream();
        if (!discardRecordingRef.current && blob.size > 0 && dur >= 1) {
          onRecordingComplete(blob, dur);
        }
        discardRecordingRef.current = false;
        setDuration(0);
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop after 2 minutes
      autoStopTimeoutRef.current = setTimeout(() => finishRecording(false), 120000);
    } catch {
      // Permission denied or not supported
    }
  }, [finishRecording, onRecordingComplete, stopStream]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
      stopStream();
    };
  }, [clearTimers, stopStream]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-1.5 shadow-soft">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full"
          onClick={() => finishRecording(true)}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <div className="flex items-end gap-0.5 h-5" aria-hidden>
            {[2, 4, 3, 5, 3].map((height, index) => (
              <span
                key={index}
                className="w-1 rounded-full bg-primary/70 animate-[pulse_0.85s_ease-in-out_infinite]"
                style={{ height: `${height * 4}px`, animationDelay: `${index * 0.12}s` }}
              />
            ))}
          </div>
          <span className="text-xs font-medium tabular-nums text-foreground">{formatDuration(duration)}</span>
        </div>

        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 rounded-full"
          onClick={() => finishRecording(false)}
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="flex-shrink-0 h-9 w-9 rounded-xl"
      onClick={startRecording}
      disabled={disabled}
      title="Voice message"
    >
      <Mic className="w-5 h-5 text-muted-foreground" />
    </Button>
  );
}
