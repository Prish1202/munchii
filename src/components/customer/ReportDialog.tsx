import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitReport } from '@/hooks/useAbuseReport';
import { Flag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const REPORT_TYPES = [
  { id: 'spam', label: '🚫 Spam' },
  { id: 'harassment', label: '😠 Harassment or Bullying' },
  { id: 'inappropriate', label: '⚠️ Inappropriate Content' },
  { id: 'impersonation', label: '🎭 Impersonation' },
  { id: 'other', label: '📝 Other' },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedMessageId?: string;
}

export function ReportDialog({ open, onOpenChange, reportedUserId, reportedMessageId }: ReportDialogProps) {
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const submitReport = useSubmitReport();

  const handleSubmit = () => {
    if (!type || !reason.trim()) return;
    submitReport.mutate(
      { reportedUserId, reportedMessageId, reportType: type, reason: reason.trim() },
      { onSuccess: () => { onOpenChange(false); setType(''); setReason(''); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Reports are confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setType(rt.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  type === rt.id ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border hover:border-muted-foreground/30'
                )}
              >
                {rt.label}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Tell us more about what happened..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="rounded-xl resize-none"
            maxLength={500}
          />

          <Button
            onClick={handleSubmit}
            disabled={!type || !reason.trim() || submitReport.isPending}
            className="w-full rounded-xl"
            variant="destructive"
          >
            {submitReport.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
