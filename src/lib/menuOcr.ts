import workerPath from 'tesseract.js/dist/worker.min.js?url';
import type { Worker } from 'tesseract.js';

/** All recognition runs locally. Only the OCR engine/language assets are downloaded. */
export async function scanMenuImage(
  file: File,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
): Promise<string> {
  let worker: Worker | undefined;
  let bitmap: ImageBitmap | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rejectStopped: (reason: Error) => void = () => undefined;
  const stopped = new Promise<never>((_, reject) => { rejectStopped = reject; });
  const stop = () => rejectStopped(new Error('Scanning cancelled.'));
  signal.addEventListener('abort', stop, { once: true });
  try {
    if (signal.aborted) throw new Error('Scanning cancelled.');
    timeout = setTimeout(() => rejectStopped(new Error('Scanning took too long. Try a smaller, clearer photo.')), 120_000);
    const work = async () => {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (signal.aborted) throw new Error('Scanning cancelled.');
      if (bitmap.width * bitmap.height > 40_000_000) throw new Error('This photo is too large. Choose an image under 40 megapixels.');
      const scale = Math.min(1, 2600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your device could not read this photo. Try another image.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      bitmap = undefined;
      const { createWorker, OEM, PSM } = await import('tesseract.js');
      if (signal.aborted) throw new Error('Scanning cancelled.');
      worker = await createWorker('eng', OEM.LSTM_ONLY, {
        workerPath,
        logger: message => {
          if (!signal.aborted) onProgress(message.status === 'recognizing text' ? 30 + Math.round(message.progress * 69) : Math.min(29, Math.round(message.progress * 29)));
        },
        errorHandler: () => rejectStopped(new Error('Could not start scanning. Check your connection and try again.')),
      });
      if (signal.aborted || expired) {
        await worker.terminate();
        worker = undefined;
        throw new Error('Scanning cancelled.');
      }
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: '1' });
      const result = await worker.recognize(canvas);
      return result.data.text;
    };
    let expired = false;
    try {
      return await Promise.race([work(), stopped]);
    } finally {
      expired = true;
    }
  } finally {
    if (timeout) clearTimeout(timeout);
    signal.removeEventListener('abort', stop);
    bitmap?.close();
    await worker?.terminate().catch(() => undefined);
  }
}