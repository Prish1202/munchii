import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { uploadToB2, B2UploadResult } from '@/lib/b2Upload';

export function useB2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (
    file: File,
    folder: string,
    customFileName?: string,
  ): Promise<B2UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const result = await uploadToB2(file, folder, {
        customFileName,
        onProgress: setProgress,
      });
      return result;
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
