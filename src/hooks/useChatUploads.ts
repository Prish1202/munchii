import { useCallback, useRef, useState } from 'react';
import { uploadToB2, B2UploadResult } from '@/lib/b2Upload';

export type ChatUploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';

export interface ChatUploadItem {
  id: string;
  file: File;
  folder: string;
  mediaType: 'image' | 'video' | 'file' | 'voice';
  status: ChatUploadStatus;
  progress: number;
  error?: string;
  result?: B2UploadResult;
}

interface EnqueueOptions {
  file: File;
  folder: string;
  mediaType: ChatUploadItem['mediaType'];
  onSuccess: (item: ChatUploadItem, result: B2UploadResult) => Promise<void> | void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatUploads() {
  const [items, setItems] = useState<ChatUploadItem[]>([]);
  const controllers = useRef<Map<string, AbortController>>(new Map());
  const onSuccessMap = useRef<Map<string, EnqueueOptions['onSuccess']>>(new Map());

  const updateItem = useCallback((id: string, patch: Partial<ChatUploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const runUpload = useCallback(async (item: ChatUploadItem) => {
    const onSuccess = onSuccessMap.current.get(item.id);
    const controller = new AbortController();
    controllers.current.set(item.id, controller);

    updateItem(item.id, { status: 'uploading', progress: 0, error: undefined });

    try {
      const result = await uploadToB2(item.file, item.folder, {
        signal: controller.signal,
        onProgress: (pct) => updateItem(item.id, { progress: pct }),
      });
      updateItem(item.id, { status: 'success', progress: 100, result });
      await onSuccess?.({ ...item, status: 'success', progress: 100, result }, result);
      // Auto-remove successful items after a short delay
      setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        controllers.current.delete(item.id);
        onSuccessMap.current.delete(item.id);
      }, 800);
    } catch (err: any) {
      const msg = err?.message || 'Upload failed';
      const cancelled = msg.includes('aborted');
      updateItem(item.id, {
        status: cancelled ? 'cancelled' : 'error',
        error: cancelled ? 'Cancelled' : msg,
      });
    } finally {
      controllers.current.delete(item.id);
    }
  }, [updateItem]);

  const enqueue = useCallback((opts: EnqueueOptions) => {
    const id = uid();
    const item: ChatUploadItem = {
      id,
      file: opts.file,
      folder: opts.folder,
      mediaType: opts.mediaType,
      status: 'pending',
      progress: 0,
    };
    onSuccessMap.current.set(id, opts.onSuccess);
    setItems((prev) => [...prev, item]);
    // Kick off after state commit
    setTimeout(() => runUpload(item), 0);
    return id;
  }, [runUpload]);

  const retry = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) setTimeout(() => runUpload(target), 0);
      return prev;
    });
  }, [runUpload]);

  const cancel = useCallback((id: string) => {
    const ctrl = controllers.current.get(id);
    if (ctrl) ctrl.abort();
  }, []);

  const dismiss = useCallback((id: string) => {
    const ctrl = controllers.current.get(id);
    if (ctrl) ctrl.abort();
    controllers.current.delete(id);
    onSuccessMap.current.delete(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const isUploading = items.some((it) => it.status === 'uploading' || it.status === 'pending');

  return { items, enqueue, retry, cancel, dismiss, isUploading };
}
