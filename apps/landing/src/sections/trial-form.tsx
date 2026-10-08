import {
  BUILDING_SIZES,
  BUILDING_TYPES,
  checkTrialRequest,
  type TrialRequestField,
  type TrialRequestProblem,
} from '@indoor/domain/trial-request';
import { Button, cn, VENDOR_EMAIL } from '@indoor/ui';
import { CircleCheckIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useRef, useState } from 'react';
import { privacyPage } from '../chrome';
import { useLanguage } from '../language';
import { Section } from './content';

type Problems = Partial<Record<TrialRequestField, TrialRequestProblem>>;
type Status = 'idle' | 'sending' | 'sent' | 'rate_limited' | 'failed';

/** Alamat fungsi form trial di server vendor. */
export function trialEndpoint(): string {
  const configured = import.meta.env.VITE_TRIAL_ENDPOINT;
  if (configured) return configured;
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/functions/v1/trial-request`;
}

const input =
  'h-(--control-height) w-full rounded-sm border border-line bg-surface px-3 text-ink aria-invalid:border-danger';

function Field({
  id,
  label,
  hint,
  problem,
  children,
}: {
  id: TrialRequestField;
  label: string;
  hint?: string;
  problem: string | null;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1">
      <label htmlFor={`trial-${id}`} className="font-bold">
        {label}
      </label>
      {children}
      {hint ? (
        <span id={`trial-${id}-hint`} className="text-ink-muted text-sm">
          {hint}
        </span>
      ) : null}
      {problem ? (
        <span id={`trial-${id}-error`} className="font-bold text-danger text-sm">
          {problem}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Form permintaan trial (T-505): divalidasi di browser dengan aturan yang sama dengan server,
 * dikirim ke fungsi vendor yang mengirim email ke vendor dan konfirmasi ke pemohon.
 */
export function TrialForm() {
  const { language, copy } = useLanguage();
  const t = copy.trial;
  const [problems, setProblems] = useState<Problems>({});
  const [status, setStatus] = useState<Status>('idle');
  const summary = useRef<HTMLParagraphElement>(null);

  const message = (field: TrialRequestField) => {
    const problem = problems[field];
    if (!problem) return null;
    return field === 'consent' ? t.consentRequired : t.problems[problem];
  };
  const described = (field: TrialRequestField, hint = false) =>
    [hint ? `trial-${field}-hint` : '', problems[field] ? `trial-${field}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined;
  const fieldProps = (field: TrialRequestField, hint = false) => ({
    id: `trial-${field}`,
    name: field,
    'aria-invalid': problems[field] ? true : undefined,
    'aria-describedby': described(field, hint),
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '');
    const payload = {
      name: value('name'),
      institution: value('institution'),
      title: value('title'),
      email: value('email'),
      phone: value('phone'),
      buildingType: value('buildingType'),
      buildingSize: value('buildingSize'),
      durationDays: Number(value('durationDays')),
      installId: value('installId'),
      consent: form.get('consent') === 'on',
      language,
      website: value('website'),
    };
    const check = checkTrialRequest(payload);
    if (!check.ok) {
      setProblems(check.problems);
      setStatus('idle');
      const first = Object.keys(check.problems)[0];
      document.getElementById(`trial-${first}`)?.focus();
      return;
    }
    setProblems({});
    setStatus('sending');
    try {
      const response = await fetch(trialEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...check.value, website: payload.website }),
      });
      if (response.status === 422) {
        const body = (await response.json().catch(() => ({}))) as { problems?: Problems };
        setProblems(body.problems ?? {});
        setStatus('idle');
        return;
      }
      setStatus(response.ok ? 'sent' : response.status === 429 ? 'rate_limited' : 'failed');
    } catch {
      setStatus('failed');
    }
    summary.current?.focus();
  }

  if (status === 'sent') {
    return (
      <Section id="trial" title={t.title} tone="surface">
        <p
          ref={summary}
          tabIndex={-1}
          role="status"
          className="flex max-w-2xl items-start gap-3 rounded-lg border border-ok bg-canvas p-5 text-lg"
        >
          <CircleCheckIcon aria-hidden="true" className="mt-1 size-6 shrink-0 text-ok" />
          {t.sent}
        </p>
      </Section>
    );
  }

  const failed = status === 'failed' || status === 'rate_limited';
  return (
    <Section id="trial" title={t.title} lead={t.lead} tone="surface">
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className="grid max-w-3xl gap-5 sm:grid-cols-2"
        aria-describedby={failed ? 'trial-status' : undefined}
      >
        <Field id="name" label={t.name} problem={message('name')}>
          <input {...fieldProps('name')} className={input} autoComplete="name" maxLength={100} />
        </Field>
        <Field id="institution" label={t.institution} problem={message('institution')}>
          <input
            {...fieldProps('institution')}
            className={input}
            autoComplete="organization"
            maxLength={150}
          />
        </Field>
        <Field id="title" label={t.jobTitle} problem={message('title')}>
          <input
            {...fieldProps('title')}
            className={input}
            autoComplete="organization-title"
            maxLength={100}
          />
        </Field>
        <Field id="email" label={t.email} problem={message('email')}>
          <input
            {...fieldProps('email')}
            type="email"
            className={input}
            autoComplete="email"
            maxLength={200}
          />
        </Field>
        <Field id="phone" label={t.phone} problem={message('phone')}>
          <input
            {...fieldProps('phone')}
            type="tel"
            className={input}
            autoComplete="tel"
            maxLength={20}
          />
        </Field>
        <Field id="buildingType" label={t.buildingType} problem={message('buildingType')}>
          <select {...fieldProps('buildingType')} className={input} defaultValue="">
            <option value="" disabled>
              {t.choose}
            </option>
            {BUILDING_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.types[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="buildingSize" label={t.buildingSize} problem={message('buildingSize')}>
          <select {...fieldProps('buildingSize')} className={input} defaultValue="">
            <option value="" disabled>
              {t.choose}
            </option>
            {BUILDING_SIZES.map((size) => (
              <option key={size} value={size}>
                {t.sizes[size]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="durationDays"
          label={t.durationDays}
          hint={t.durationHint}
          problem={message('durationDays')}
        >
          <input
            {...fieldProps('durationDays', true)}
            type="number"
            min={14}
            max={30}
            step={1}
            defaultValue={14}
            inputMode="numeric"
            className={input}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            id="installId"
            label={t.installId}
            hint={t.installHint}
            problem={message('installId')}
          >
            <input
              {...fieldProps('installId', true)}
              className={cn(input, 'font-mono')}
              autoComplete="off"
              spellCheck={false}
              maxLength={36}
            />
          </Field>
        </div>
        {/* Honeypot: tersembunyi dari pengguna dan pembaca layar; hanya bot yang mengisinya. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="trial-website">{t.honeypot}</label>
          <input id="trial-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <label className="flex items-start gap-3">
            <input
              {...fieldProps('consent')}
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-ink"
            />
            <span>
              {t.consent}{' '}
              <a href={privacyPage(language)} className="font-bold underline">
                {t.privacy}
              </a>
              .
            </span>
          </label>
          {problems.consent ? (
            <span id="trial-consent-error" className="font-bold text-danger text-sm">
              {t.consentRequired}
            </span>
          ) : null}
        </div>
        {Object.keys(problems).length ? (
          <p role="alert" className="font-bold text-danger sm:col-span-2">
            {t.fixErrors}
          </p>
        ) : null}
        {failed ? (
          <p
            id="trial-status"
            ref={summary}
            tabIndex={-1}
            role="alert"
            className="rounded-sm border border-danger p-3 sm:col-span-2"
          >
            {status === 'rate_limited' ? (
              t.rateLimited
            ) : (
              <>
                {t.failed}{' '}
                <a href={`mailto:${VENDOR_EMAIL}`} className="font-bold underline">
                  {VENDOR_EMAIL}
                </a>
                .
              </>
            )}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" disabled={status === 'sending'}>
            {status === 'sending' ? t.sending : t.submit}
          </Button>
        </div>
      </form>
    </Section>
  );
}
