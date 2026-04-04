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

      setProgress(20);

      const uploadResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/b2-signed-url`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': contentType,
          'x-b2-file-path': filePath,
          'x-b2-content-type': contentType,
        },
        body: file,
      });

      const responseText = await uploadResp.text();
      let responseData: Partial<UploadResult> & { error?: string } | null = null;

      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = null;
      }

      if (!uploadResp.ok) {
        throw new Error(responseData?.error || responseText || 'Upload failed');
      }

      if (!responseData?.publicUrl) {
        throw new Error('Upload completed but no file URL was returned');
      }

      setProgress(85);
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
    }
  }, []);

  return { upload, isUploading, progress };
}
