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
      const filePath = `${folder}/${fileName}`;

      // Get upload URL from edge function
      const { data: signedData, error: signError } = await supabase.functions.invoke('b2-signed-url', {
        body: {
          action: 'upload',
          filePath,
          contentType: file.type || 'application/octet-stream',
        },
      });

      if (signError || !signedData?.uploadUrl) {
        throw new Error(signError?.message || 'Failed to get upload URL');
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Compute SHA1 hash
      const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setProgress(30);

      // Upload directly to B2
      const uploadResp = await fetch(signedData.uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: signedData.authorizationToken,
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': String(file.size),
          'X-Bz-File-Name': encodeURIComponent(filePath),
          'X-Bz-Content-Sha1': sha1,
        },
        body: arrayBuffer,
      });

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      setProgress(100);

      return {
        publicUrl: signedData.publicUrl,
        filePath,
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
