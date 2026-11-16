import { PAID_DEFAULT_QUOTA } from '@indoor/domain/license-issue';
import {
  LICENSE_KEY_DEFAULT_DAYS,
  LICENSE_KEY_MAX_DAYS,
  type LicenseKeyRequest,
  readLicenseKeyRequest,
} from '@indoor/domain/license-key';
import { Button, Input, Label } from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import {
  FeatureFieldset,
  FormProblem,
  fromQuotaDraft,
  QuotaFieldset,
  toQuotaDraft,
} from './license-fields';

export function LicenseKeyForm({
  clientId,
  pending,
  onSubmit,
  onCancel,
}: {
  clientId: string;
  pending: boolean;
  onSubmit: (request: LicenseKeyRequest) => void;
  onCancel: () => void;
}) {
  const [plan, setPlan] = useState('');
  const [days, setDays] = useState(String(LICENSE_KEY_DEFAULT_DAYS));
  const [quota, setQuota] = useState(() => toQuotaDraft(PAID_DEFAULT_QUOTA));
  const [features, setFeatures] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const check = readLicenseKeyRequest({
      clientId,
      plan,
      durationDays: Number(days),
      quota: fromQuotaDraft(quota),
      features,
    });
    if (!check.ok) {
      setProblem(check.message);
      return;
    }
    setProblem(null);
    onSubmit(check.request);
  };

  return (
    <form className="grid gap-5" onSubmit={submit} aria-label="Buat kunci lisensi">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="key-plan">Paket</Label>
          <Input
            id="key-plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            maxLength={64}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="key-days">Masa berlaku (hari sejak aktivasi)</Label>
          <Input
            id="key-days"
            type="number"
            inputMode="numeric"
            min={1}
            max={LICENSE_KEY_MAX_DAYS}
            step={1}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            required
          />
        </div>
      </div>
      <QuotaFieldset idPrefix="key-quota" value={quota} onChange={setQuota} />
      <FeatureFieldset value={features} onChange={setFeatures} />
      <FormProblem message={problem} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Membuat…' : 'Buat kunci'}
        </Button>
      </div>
    </form>
  );
}
