import {
  FEATURE_LABELS,
  LIMIT_KINDS,
  LIMIT_LABELS,
  PAID_FEATURES,
  QUOTA_KINDS,
  QUOTA_LABELS,
} from '@indoor/domain';
import type { LicenseQuota } from '@indoor/domain/license';
import {
  type LicenseIssueDefaults,
  type LicenseIssueRequest,
  readLicenseIssueRequest,
  trialIssueDefaults,
} from '@indoor/domain/license-issue';
import { Button, Input, Label } from '@indoor/ui';
import { type FormEvent, useState } from 'react';

type QuotaKey = keyof LicenseQuota;

const REQUIRED: readonly QuotaKey[] = ['venues', 'buildings', 'floors', 'infoPoints'];
const QUOTA_FIELDS: { key: QuotaKey; label: string }[] = [
  ...QUOTA_KINDS.map((key) => ({ key, label: QUOTA_LABELS[key] })),
  ...LIMIT_KINDS.map((key) => ({ key, label: LIMIT_LABELS[key] })),
];

interface Draft {
  plan: string;
  validFrom: string;
  validUntil: string;
  quota: Record<QuotaKey, string>;
  features: string[];
}

function toDraft(defaults: LicenseIssueDefaults): Draft {
  const quota = Object.fromEntries(
    QUOTA_FIELDS.map(({ key }) => [key, defaults.quota[key]?.toString() ?? '']),
  ) as Record<QuotaKey, string>;
  return { ...defaults, quota };
}

function toInput(installationId: string, draft: Draft) {
  const quota = Object.fromEntries(
    QUOTA_FIELDS.filter(({ key }) => REQUIRED.includes(key) || draft.quota[key].trim() !== '').map(
      ({ key }) => [key, Number(draft.quota[key])],
    ),
  );
  return { installationId, ...draft, quota };
}

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
  const toggle = (feature: string, on: boolean) =>
    update({
      features: on
        ? [...draft.features, feature]
        : draft.features.filter((item) => item !== feature),
    });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const check = readLicenseIssueRequest(toInput(installationId, draft));
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

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-bold">Kuota</legend>
        <p className="text-ink-muted text-sm">
          Empat kuota pertama wajib diisi. Kuota lain yang dikosongkan berarti tidak dibatasi.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUOTA_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid content-start gap-1">
              <Label htmlFor={`quota-${key}`}>{label}</Label>
              <Input
                id={`quota-${key}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={draft.quota[key]}
                onChange={(event) =>
                  update({ quota: { ...draft.quota, [key]: event.target.value } })
                }
                required={REQUIRED.includes(key)}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-1 font-bold">Fitur berbayar</legend>
        {PAID_FEATURES.map((feature) => (
          <label key={feature} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={draft.features.includes(feature)}
              onChange={(event) => toggle(feature, event.target.checked)}
            />
            {FEATURE_LABELS[feature]}
          </label>
        ))}
      </fieldset>

      {problem ? (
        <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
          {problem}
        </p>
      ) : null}

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
