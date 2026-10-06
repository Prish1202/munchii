import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AGREEMENTS, MORE_LEGAL_GROUPS } from '@/lib/merchantAgreements';
import { AgreementBody } from '@/components/restaurant/AgreementBody';
import { cn } from '@/lib/utils';

export default function RestaurantAgreements() {
  const { group } = useParams();
  const current = MORE_LEGAL_GROUPS.find((g) => g.slug === group) ?? MORE_LEGAL_GROUPS[0];
  const [open, setOpen] = useState<string | null>(current.docs.length === 1 ? current.docs[0] : null);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5 pb-24 md:pb-8">
        <Link to="/restaurant/more" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> More
        </Link>
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">{current.title}</h1>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </header>
        <div className="overflow-hidden rounded-lg border bg-card">
          {current.docs.map((id, i) => {
            const doc = AGREEMENTS[id];
            const isOpen = open === id;
            return (
              <div key={id} className={cn(i > 0 && 'border-t')}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60"
                  aria-expanded={isOpen}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{doc.title}</span>
                    <span className="block text-xs text-muted-foreground">{doc.summary}</span>
                  </span>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && <div className="border-t px-4 py-4"><AgreementBody id={id} /></div>}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
