import {
  type LicenseIssueDefaults,
  type LicenseIssueRequest,
  readLicenseIssueRequest,
  trialIssueDefaults,
} from '@indoor/domain/license-issue';
import { Button, Input, Label } from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import {
  FeatureFieldset,
  FormProblem,
  fromQuotaDraft,
  type QuotaDraft,
  QuotaFieldset,
  toQuotaDraft,
} from './license-fields';

interface Draft {
  plan: string;
  validFrom: string;
  validUntil: string;
  quota: QuotaDraft;
  features: string[];
}

const toDraft = (defaults: LicenseIssueDefaults): Draft => ({
  ...defaults,
  quota: toQuotaDraft(defaults.quota),
});

export function LicenseForm({
  installationId,
  defaults,
  today,
  pending,
  onSubmit,
  onCancel,
}: {
  installationId: string;
  defaults: LicenseIssueDefaults;
  today: string;
  pending: boolean;
  onSubmit: (request: LicenseIssueRequest) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => toDraft(defaults));
  const [problem, setProblem] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const check = readLicenseIssueRequest({
      installationId,
      ...draft,
      quota: fromQuotaDraft(draft.quota),
    });
    if (!check.ok) {
      setProblem(check.message);
      return;
    }
    setProblem(null);
    onSubmit(check.request);
  };

  return (
    <form className="grid gap-5" onSubmit={submit} aria-label="Terbitkan lisensi">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="license-plan">Paket</Label>
          <Input
            id="license-plan"
            value={draft.plan}
            onChange={(event) => update({ plan: event.target.value })}
            maxLength={64}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="license-from">Berlaku mulai</Label>
          <Input
            id="license-from"
            type="date"
            value={draft.validFrom}
            onChange={(event) => update({ validFrom: event.target.value })}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="license-until">Berlaku sampai</Label>
          <Input
            id="license-until"
            type="date"
            value={draft.validUntil}
            onChange={(event) => update({ validUntil: event.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          onClick={() => setDraft(toDraft(trialIssueDefaults(today)))}
        >
          Isi paket trial bawaan (30 hari)
        </Button>
      </div>

      <QuotaFieldset idPrefix="quota" value={draft.quota} onChange={(quota) => update({ quota })} />
      <FeatureFieldset value={draft.features} onChange={(features) => update({ features })} />
      <FormProblem message={problem} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Menandatangani…' : 'Terbitkan dan unduh'}
        </Button>
      </div>
    </form>
  );
}
