import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadResult {
  publicUrl: string;
  filePath: string;
}

export function useB2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (
    file: File,
    folder: string,
    customFileName?: string,
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const fileName = customFileName || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
      const filePath = normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
      const contentType = file.type || 'application/octet-stream';

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in again and try uploading.');
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/b2-signed-url`;

      const responseData = await new Promise<Partial<UploadResult> & { error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.setRequestHeader('x-b2-file-path', filePath);
        xhr.setRequestHeader('x-b2-content-type', contentType);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            // Cap at 95% until server confirms
            const pct = Math.min(95, Math.round((evt.loaded / evt.total) * 95));
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          let parsed: any = null;
          try { parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { /* ignore */ }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsed || {});
          } else {
            reject(new Error(parsed?.error || xhr.responseText || 'Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.send(file);
      });

      if (!responseData?.publicUrl) {
        throw new Error('Upload completed but no file URL was returned');
      }

      setProgress(100);

      return {
        publicUrl: responseData.publicUrl,
        filePath: responseData.filePath || filePath,
      };
    } catch (err: any) {
      console.error('B2 upload error:', err);
      toast.error(err.message || 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }, []);

  return { upload, isUploading, progress };
}
