import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Plus, ScanLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { MenuImportRow, parseMenuText, validateMenuImportRows } from '@/lib/menuImport';
import { merchantTerms } from '@/lib/merchantTerms';
import './menuPhotoImport.css';

interface Props {
  restaurantId: string;
  merchantType?: string;
  categories: { id: string; name: string }[];
}

export function MenuPhotoImport({ restaurantId, merchantType, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [review, setReview] = useState(false);
  const [rows, setRows] = useState<MenuImportRow[]>([]);
  const [category, setCategory] = useState('none');
  const [instant, setInstant] = useState(merchantType === 'grocery');
  const [prep, setPrep] = useState('10');
  const inputRef = useRef<HTMLInputElement>(null);
  const runRef = useRef<AbortController | null>(null);
  const saveLock = useRef(false);
  const queryClient = useQueryClient();
  const terms = merchantTerms(merchantType);

  useEffect(() => () => runRef.current?.abort(), []);
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const scan = async (image: File) => {
    runRef.current?.abort();
    const controller = new AbortController();
    runRef.current = controller;
    setScanning(true);
    setProgress(0);
    setError('');
    setRows([]);
    setText('');
    setReview(false);
    try {
      const { scanMenuImage } = await import('@/lib/menuOcr');
      if (controller.signal.aborted) return;
      const source = await scanMenuImage(image, controller.signal, value => {
        if (runRef.current === controller) setProgress(previous => Math.max(previous, value));
      });
      if (controller.signal.aborted) return;
      const parsed = parseMenuText(source).map(row => ({ ...row, id: crypto.randomUUID() }));
      setText(source);
      setRows(parsed);
      setProgress(100);
      setReview(true);
      if (!parsed.length) setError('No item-and-price lines found. Edit the extracted text or add items below.');
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not scan this photo. Please try again.');
    } finally {
      if (runRef.current === controller) setScanning(false);
    }
  };

  const chooseFile = (image: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(image.type)) {
      setError('Choose a JPG, PNG, WebP or BMP photo.');
      return;
    }
    if (image.size > 20 * 1024 * 1024) { setError('Choose a photo smaller than 20 MB.'); return; }
    setFile(image);
    setPreview(URL.createObjectURL(image));
    void scan(image);
  };

  const save = useMutation({
    mutationFn: async () => {
      const invalid = validateMenuImportRows(rows);
      if (invalid) throw new Error(invalid);
      const minutes = Number(prep);
      if (!instant && (!Number.isInteger(minutes) || minutes < 1 || minutes > 180)) throw new Error('Preparation time must be between 1 and 180 minutes.');
      if (category !== 'none' && !categories.some(value => value.id === category)) throw new Error('Select an existing category.');
      // Stable IDs make retrying a confirmed-but-interrupted request safe; no existing menu rows are overwritten.
      const { error: insertError } = await supabase.from('menu_items').upsert(rows.map(row => ({
        id: row.id,
        restaurant_id: restaurantId,
        name: row.name.trim(),
        price: Number(row.price),
        available: false,
        image_url: null,
        category_id: category === 'none' ? null : category,
        discount_percent: 0,
        preparation_time_minutes: instant ? 1 : minutes,
        fulfillment_type: instant ? 'READY_TO_PICK' as const : 'PREPARE' as const,
        quantity_type: 'FIXED' as const,
        quantity_options: [],
      })), { onConflict: 'id', ignoreDuplicates: true });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      void queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
      toast.success(`${rows.length} ${rows.length === 1 ? 'item' : 'items'} saved as unavailable`);
      reset();
      setOpen(false);
    },
    onError: () => setError('Could not save the items. Your review is still here; check your connection and try again.'),
  });

  function reset() {
    runRef.current?.abort();
    runRef.current = null;
    setScanning(false);
    setPreview('');
    setFile(null);
    setRows([]);
    setText('');
    setReview(false);
    setError('');
    setProgress(0);
    setCategory('none');
    setInstant(merchantType === 'grocery');
    setPrep('10');
  }

  const changeOpen = (next: boolean) => {
    if (saveLock.current) return;
    if (!next) reset();
    setOpen(next);
  };
  const updateRow = (id: string, field: 'name' | 'price', value: string) => setRows(previous => previous.map(row => row.id === id ? { ...row, [field]: value } : row));
  const handleSave = async () => {
    if (saveLock.current) return;
    const invalid = validateMenuImportRows(rows);
    if (invalid) { setError(invalid); return; }
    if (!instant && (!Number.isInteger(Number(prep)) || Number(prep) < 1 || Number(prep) > 180)) {
      setError('Preparation time must be between 1 and 180 minutes.'); return;
    }
    saveLock.current = true;
    setError('');
    try { await save.mutateAsync(); } catch { /* Review stays open for retry. */ }
    finally { saveLock.current = false; }
  };

  return <>
    <Button variant="outline" onClick={() => changeOpen(true)}><ScanLine className="mr-2 h-4 w-4" />Scan menu</Button>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="restaurant-theme max-w-3xl max-h-[90dvh] overflow-y-auto w-[calc(100%-1rem)] rounded-lg"
        onEscapeKeyDown={event => { if (saveLock.current) event.preventDefault(); }}
        onInteractOutside={event => { if (scanning || review || saveLock.current) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Scan {terms.catalog.toLowerCase()} photo</DialogTitle>
          <DialogDescription>{review ? 'Review names and prices. Items are saved as unavailable until you add individual photos and enable them.' : 'Choose a clear photo with item names and prices. The photo stays on your device; scanning tools download on first use.'}</DialogDescription>
        </DialogHeader>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" className="hidden" aria-label="Menu photo" onChange={event => {
          const image = event.target.files?.[0]; event.target.value = ''; if (image) chooseFile(image);
        }} />
        {preview && <div className="relative h-52 sm:h-64 overflow-hidden rounded-lg border border-border bg-muted">
          <img src={preview} alt="Selected menu photo" className="h-full w-full object-contain" />
          {scanning && <div className="absolute inset-0 overflow-hidden bg-background/25">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary animate-[menu-scan_2s_ease-in-out_infinite] motion-reduce:animate-none" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-background/90 p-3 text-sm" role="status">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-primary" />{progress < 30 ? 'Preparing scanner' : 'Scanning photo'} · {progress}%
            </div>
          </div>}
        </div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!scanning && <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={save.isPending} onClick={() => inputRef.current?.click()}><ImagePlus className="h-4 w-4 mr-2" />{file ? 'Change photo' : 'Choose photo'}</Button>
          {file && !review && <Button variant="outline" onClick={() => void scan(file)}>Retry scan</Button>}
        </div>}
        {review && <>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Extracted text</summary>
            <Textarea className="mt-2" aria-label="Extracted menu text" rows={5} value={text} disabled={save.isPending} onChange={event => setText(event.target.value)} />
            <Button variant="outline" className="mt-2" disabled={save.isPending} onClick={() => {
              if (rows.length && !window.confirm('Replace your reviewed rows with items from this text?')) return;
              setRows(parseMenuText(text).map(row => ({ ...row, id: crypto.randomUUID() })));
              setError('');
            }}>Read items from text</Button>
          </details>
          <fieldset disabled={save.isPending} className="min-w-0 space-y-4">
            <Table className="table-fixed">
              <TableHeader><TableRow><TableHead className="px-1">Item name</TableHead><TableHead className="w-28 px-1">Price (₹)</TableHead><TableHead className="w-10 p-0"><span className="sr-only">Remove</span></TableHead></TableRow></TableHeader>
              <TableBody>{rows.map((row, index) => <TableRow key={row.id}>
                <TableCell className="px-1 py-2"><Input aria-label={`Item name ${index + 1}`} value={row.name} onChange={event => updateRow(row.id, 'name', event.target.value)} /></TableCell>
                <TableCell className="px-1 py-2"><Input aria-label={`Price ${index + 1}`} type="number" min="0.01" step="0.01" inputMode="decimal" value={row.price} onChange={event => updateRow(row.id, 'price', event.target.value)} /></TableCell>
                <TableCell className="p-0"><Button variant="ghost" size="icon" className="text-destructive" aria-label={`Remove item ${index + 1}`} title="Remove item" onClick={() => setRows(previous => previous.filter(value => value.id !== row.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>)}</TableBody>
            </Table>
            <Button variant="outline" onClick={() => setRows(previous => [...previous, { id: crypto.randomUUID(), name: '', price: '' }])}><Plus className="h-4 w-4 mr-2" />Add row</Button>
            {categories.length > 0 && <div className="space-y-2"><Label>Category for these items</Label><Select value={category} onValueChange={setCategory} disabled={save.isPending}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Uncategorized</SelectItem>{categories.map(value => <SelectItem key={value.id} value={value.id}>{value.name}</SelectItem>)}</SelectContent></Select></div>}
            <div className="flex justify-between items-center gap-3"><Label htmlFor="import-instant">Ready instantly</Label><Switch id="import-instant" checked={instant} onCheckedChange={setInstant} disabled={save.isPending} /></div>
            {!instant && <div className="space-y-2"><Label htmlFor="import-prep">Preparation time (minutes)</Label><Input id="import-prep" type="number" min="1" max="180" value={prep} onChange={event => setPrep(event.target.value)} /></div>}
          </fieldset>
        </>}
        <div className="flex justify-end flex-wrap gap-2">
          <Button variant="outline" disabled={save.isPending} onClick={() => changeOpen(false)}>{scanning ? 'Cancel scan' : 'Cancel'}</Button>
          {review && <Button disabled={save.isPending || !rows.length} onClick={() => void handleSave()}>{save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{save.isPending ? 'Saving…' : `Save ${rows.length} ${rows.length === 1 ? 'item' : 'items'}`}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}