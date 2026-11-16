import {
  FEATURE_LABELS,
  LIMIT_KINDS,
  LIMIT_LABELS,
  PAID_FEATURES,
  QUOTA_KINDS,
  QUOTA_LABELS,
} from '@indoor/domain';
import type { LicenseQuota } from '@indoor/domain/license';
import { Input, Label } from '@indoor/ui';

export type QuotaKey = keyof LicenseQuota;
export type QuotaDraft = Record<QuotaKey, string>;

const REQUIRED: readonly QuotaKey[] = ['venues', 'buildings', 'floors', 'infoPoints'];
const QUOTA_FIELDS: { key: QuotaKey; label: string }[] = [
  ...QUOTA_KINDS.map((key) => ({ key, label: QUOTA_LABELS[key] })),
  ...LIMIT_KINDS.map((key) => ({ key, label: LIMIT_LABELS[key] })),
];

export function toQuotaDraft(quota: LicenseQuota): QuotaDraft {
  return Object.fromEntries(
    QUOTA_FIELDS.map(({ key }) => [key, quota[key]?.toString() ?? '']),
  ) as QuotaDraft;
}

export function fromQuotaDraft(draft: QuotaDraft): Record<string, number> {
  return Object.fromEntries(
    QUOTA_FIELDS.filter(({ key }) => REQUIRED.includes(key) || draft[key].trim() !== '').map(
      ({ key }) => [key, Number(draft[key])],
    ),
  );
}

export function QuotaFieldset({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: QuotaDraft;
  onChange: (value: QuotaDraft) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 font-bold">Kuota</legend>
      <p className="text-ink-muted text-sm">
        Empat kuota pertama wajib diisi. Kuota lain yang dikosongkan berarti tidak dibatasi.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUOTA_FIELDS.map(({ key, label }) => (
          <div key={key} className="grid content-start gap-1">
            <Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>
            <Input
              id={`${idPrefix}-${key}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={value[key]}
              onChange={(event) => onChange({ ...value, [key]: event.target.value })}
              required={REQUIRED.includes(key)}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function FeatureFieldset({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-bold">Fitur berbayar</legend>
      {PAID_FEATURES.map((feature) => (
        <label key={feature} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={value.includes(feature)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...value, feature]
                  : value.filter((item) => item !== feature),
              )
            }
          />
          {FEATURE_LABELS[feature]}
        </label>
      ))}
    </fieldset>
  );
}

export function FormProblem({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
      {message}
    </p>
  ) : null;
}
