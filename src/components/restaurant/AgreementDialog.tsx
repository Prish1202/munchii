import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AGREEMENTS, AgreementId } from '@/lib/merchantAgreements';
import { AgreementBody } from './AgreementBody';

export function AgreementDialog({ id, onClose }: { id: AgreementId | null; onClose: () => void }) {
  const doc = id ? AGREEMENTS[id] : null;
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {doc && (
          <>
            <DialogHeader>
              <DialogTitle>{doc.title}</DialogTitle>
              <DialogDescription>{doc.summary}</DialogDescription>
            </DialogHeader>
            <AgreementBody id={doc.id} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
