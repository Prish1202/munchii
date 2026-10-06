import { AGREEMENTS, AGREEMENTS_VERSION, AgreementId } from '@/lib/merchantAgreements';

export function AgreementBody({ id }: { id: AgreementId }) {
  const doc = AGREEMENTS[id];
  return (
    <div className="space-y-4 text-sm">
      {doc.sections.map((s, i) => (
        <section key={s.heading} className="space-y-1.5">
          <h3 className="font-semibold">{i + 1}. {s.heading}</h3>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {s.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">Version {AGREEMENTS_VERSION}</p>
    </div>
  );
}
