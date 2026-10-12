import {
  BUILDING_SIZES,
  BUILDING_TYPES,
  checkHostedTrialRequest,
  type TrialRequestField,
  type TrialRequestProblem,
} from '@indoor/domain/trial-request';
import { Button, Input, Label } from '@indoor/ui';
import { CheckIcon, MailCheckIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { privacyPage } from '../chrome';
import { useLanguage } from '../language';
import { Section } from '../sections/content';
import { DEMO_URL, requestTrial } from './api';
import { TRIAL_COPY } from './copy';

type Problems = Partial<Record<TrialRequestField, TrialRequestProblem>>;
type State =
  | { kind: 'editing'; problems: Problems; notice: string | null }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string };

const TEXT_FIELDS = [
  ['name', 'text', 'name'],
  ['institution', 'text', 'organization'],
  ['title', 'text', 'organization-title'],
  ['email', 'email', 'email'],
  ['phone', 'tel', 'tel'],
] as const;

// Gaya `<select>` bawaan disamakan dengan `Input`; elemen asli dipakai agar ringan dan mudah
// dipakai di HP serta pembaca layar.
const SELECT =
  'h-(--control-height) w-full min-w-0 rounded-sm border border-ink-muted bg-surface px-3 text-ink aria-invalid:border-danger';

function Field({
  id,
  label,
  problem,
  children,
}: {
  id: string;
  label: string;
  problem: string | null;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {problem ? (
        <p id={`${id}-galat`} className="text-danger text-sm">
          {problem}
        </p>
      ) : null}
    </div>
  );
}

/** Form "Minta trial" (FR-HT-01): hasilnya email verifikasi, bukan akun langsung. */
export function TrialForm() {
  const { language } = useLanguage();
  const copy = TRIAL_COPY[language];
  const [state, setState] = useState<State>({ kind: 'editing', problems: {}, notice: null });
  const problems = state.kind === 'editing' ? state.problems : {};
  const problemOf = (field: TrialRequestField) => {
    const problem = problems[field];
    return problem ? copy.form.problems[problem] : null;
  };
  const invalid = (field: TrialRequestField) =>
    problems[field]
      ? { 'aria-invalid': true as const, 'aria-describedby': `trial-${field}-galat` }
      : {};

  /** Galat sebuah kolom hilang begitu kolom itu diubah, tanpa menunggu kiriman berikutnya. */
  function edited(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name as TrialRequestField;
    if (state.kind !== 'editing' || !state.problems[name]) return;
    const { [name]: _cleared, ...rest } = state.problems;
    setState({ ...state, problems: rest });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = Object.fromEntries(
      ['name', 'institution', 'title', 'email', 'phone', 'buildingType', 'buildingSize'].map(
        (key) => [key, String(form.get(key) ?? '')],
      ),
    );
    const check = checkHostedTrialRequest({
      ...input,
      consent: form.get('consent') === 'on',
      language,
    });
    if (!check.ok) {
      setState({ kind: 'editing', problems: check.problems, notice: null });
      return;
    }
    setState({ kind: 'sending' });
    const result = await requestTrial(check.value, String(form.get('website') ?? ''));
    if (result.kind === 'sent') setState({ kind: 'sent', email: check.value.email });
    else if (result.kind === 'invalid') {
      setState({ kind: 'editing', problems: result.problems, notice: null });
    } else {
      setState({
        kind: 'editing',
        problems: {},
        notice: result.kind === 'rate_limited' ? copy.form.rateLimited : copy.form.failed,
      });
    }
  }

  return (
    <Section id="trial" title={copy.form.title} lead={copy.form.lead} tone="surface">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-4">
          <ul className="m-0 grid list-none gap-3 p-0">
            {copy.form.points.map((point) => (
              <li key={point} className="flex gap-2">
                <CheckIcon aria-hidden="true" strokeWidth={2} className="mt-1 size-4 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
          <Button asChild className="w-fit">
            <a href={DEMO_URL}>{copy.form.demo}</a>
          </Button>
        </div>
        {state.kind === 'sent' ? (
          <div role="status" className="grid content-start gap-3 rounded-lg border border-line p-6">
            <MailCheckIcon aria-hidden="true" strokeWidth={1.75} className="size-8" />
            <h3 className="font-bold text-2xl">{copy.form.sentTitle}</h3>
            <p className="text-lg">{copy.form.sentBody.replace('{email}', state.email)}</p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={submit}
            onInput={edited}
            className="grid gap-4 rounded-lg border border-line bg-canvas p-6 sm:grid-cols-2"
          >
            {TEXT_FIELDS.map(([field, type, autoComplete]) => (
              <Field
                key={field}
                id={`trial-${field}`}
                label={copy.form.labels[field]}
                problem={problemOf(field)}
              >
                <Input
                  id={`trial-${field}`}
                  name={field}
                  type={type}
                  autoComplete={autoComplete}
                  required
                  {...invalid(field)}
                />
              </Field>
            ))}
            <Field
              id="trial-buildingType"
              label={copy.form.buildingType}
              problem={problemOf('buildingType')}
            >
              <select
                id="trial-buildingType"
                name="buildingType"
                required
                defaultValue=""
                className={SELECT}
                {...invalid('buildingType')}
              >
                <option value="" disabled>
                  {copy.form.choose}
                </option>
                {BUILDING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {copy.buildingTypes[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="trial-buildingSize"
              label={copy.form.buildingSize}
              problem={problemOf('buildingSize')}
            >
              <select
                id="trial-buildingSize"
                name="buildingSize"
                required
                defaultValue=""
                className={SELECT}
                {...invalid('buildingSize')}
              >
                <option value="" disabled>
                  {copy.form.choose}
                </option>
                {BUILDING_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {copy.buildingSizes[size]}
                  </option>
                ))}
              </select>
            </Field>
            {/* Jebakan bot: tersembunyi dari pengguna dan pembaca layar, hanya diisi bot. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="trial-website">{copy.form.honeypot}</label>
              <input id="trial-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <label htmlFor="trial-consent" className="flex items-start gap-2">
                <input
                  id="trial-consent"
                  name="consent"
                  type="checkbox"
                  className="mt-1 size-4 shrink-0"
                  {...invalid('consent')}
                />
                <span>
                  {copy.form.consentBefore}
                  <a href={privacyPage(language)} className="font-bold underline">
                    {copy.form.consentLink}
                  </a>
                  .
                </span>
              </label>
              {problemOf('consent') ? (
                <p id="trial-consent-galat" className="text-danger text-sm">
                  {problemOf('consent')}
                </p>
              ) : null}
            </div>
            {state.kind === 'editing' && state.notice ? (
              <p role="alert" className="text-danger sm:col-span-2">
                {state.notice}
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" disabled={state.kind === 'sending'}>
                {state.kind === 'sending' ? copy.form.sending : copy.form.submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Section>
  );
}
