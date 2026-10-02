import {
  type AppRole,
  type Branding,
  can,
  checkImageFile,
  type Venue,
  type VenueId,
} from '@indoor/domain';
import { BRAND_DEFAULTS, Button, Input, Skeleton, toast } from '@indoor/ui';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRole } from '../../../app/auth/can';
import { Field } from '../../../app/components/field';
import { data } from '../../../app/data-client';
import { FormNotice } from '../../auth/auth-layout';
import { IMAGE_MESSAGES } from '../../locations/labels';
import { useDisplaySettings } from '../display/queries';
import {
  type BrandingFormErrors,
  type BrandingFormValues,
  colorNotes,
  livePreview,
  toBrandingFormValues,
  validateBranding,
} from './branding-form-model';
import { BrandingPreview } from './branding-preview';
import { ColorField } from './color-field';
import { type LogoChange, useSaveBranding, useVenueDetail } from './queries';

type LogoDraft = LogoChange & { previewUrl?: string };

function LogoField({
  savedUrl,
  draft,
  disabled,
  onChange,
}: {
  savedUrl: string | null;
  draft: LogoDraft;
  disabled: boolean;
  onChange: (draft: LogoDraft) => void;
}) {
  const [error, setError] = useState<string>();
  const shown =
    draft.kind === 'new' ? (draft.previewUrl ?? null) : draft.kind === 'keep' ? savedUrl : null;
  return (
    <Field
      id="branding-logo"
      label="Logo"
      hint="PNG, JPG, atau WebP, maksimal 5 MB. Sama dengan logo di data venue."
      error={error}
    >
      <div className="flex flex-wrap items-center gap-3">
        {shown ? (
          <img
            src={shown}
            alt="Logo venue"
            className="h-12 max-w-32 rounded-sm border border-line bg-surface object-contain p-1"
          />
        ) : (
          <span className="text-ink-muted text-sm">Belum ada logo.</span>
        )}
        {disabled ? null : (
          <>
            <Input
              id="branding-logo"
              type="file"
              className="max-w-64"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                const check = checkImageFile(file);
                if (!check.ok) {
                  setError(IMAGE_MESSAGES[check.problem]);
                  return;
                }
                setError(undefined);
                onChange({ kind: 'new', file, previewUrl: URL.createObjectURL(file) });
              }}
            />
            {shown ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange({ kind: 'remove' })}
              >
                Hapus logo
              </Button>
            ) : null}
            {draft.kind === 'keep' ? null : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange({ kind: 'keep' })}
              >
                Batalkan
              </Button>
            )}
          </>
        )}
      </div>
    </Field>
  );
}

function BrandingForm({
  venue,
  branding,
  role,
}: {
  venue: Venue;
  branding: Branding;
  role: AppRole | null;
}) {
  const canEdit = role !== null && can(role, 'settings.edit');
  const [values, setValues] = useState<BrandingFormValues>(() => toBrandingFormValues(branding));
  const [errors, setErrors] = useState<BrandingFormErrors>({});
  const [logo, setLogo] = useState<LogoDraft>({ kind: 'keep' });
  const save = useSaveBranding(venue.id);

  useEffect(() => {
    const url = logo.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [logo.previewUrl]);

  const live = useMemo(() => livePreview(values, venue.name), [values, venue.name]);
  const notes = useMemo(() => colorNotes(live), [live]);
  const savedLogoUrl = venue.logoPath ? data.venues.logoUrl(venue.logoPath) : null;
  const previewLogo =
    logo.kind === 'new' ? (logo.previewUrl ?? null) : logo.kind === 'keep' ? savedLogoUrl : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateBranding(values);
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    const change: LogoChange = logo.kind === 'new' ? { kind: 'new', file: logo.file } : logo;
    save.mutate(
      { branding: result.branding, logo: change },
      {
        onSuccess: (saved) => {
          setValues(toBrandingFormValues(saved.branding));
          setLogo({ kind: 'keep' });
          toast.success('Branding disimpan. Terbitkan peta agar tampil di Visitor.');
        },
      },
    );
  }

  const set = (key: keyof BrandingFormValues) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <form className="grid gap-5" onSubmit={submit} noValidate>
        <p className="text-ink-muted text-sm">
          Logo, nama, dan warna venue di Visitor dan Info Point. Teks di atas warna utama dipilih
          otomatis agar tetap terbaca.
        </p>
        <LogoField savedUrl={savedLogoUrl} draft={logo} disabled={!canEdit} onChange={setLogo} />
        <Field
          id="branding-name"
          label="Nama tampilan"
          hint={`Kosong = nama venue (${venue.name}).`}
          error={errors.displayName}
        >
          <Input
            id="branding-name"
            placeholder={venue.name}
            value={values.displayName}
            disabled={!canEdit}
            aria-invalid={errors.displayName ? true : undefined}
            onChange={(e) => set('displayName')(e.target.value)}
          />
        </Field>
        <ColorField
          id="branding-primary"
          label="Warna utama"
          fallback={BRAND_DEFAULTS.signal}
          value={values.primaryColor}
          error={errors.primaryColor}
          note={notes.primary}
          disabled={!canEdit}
          onChange={set('primaryColor')}
        />
        <ColorField
          id="branding-route"
          label="Warna rute"
          fallback={BRAND_DEFAULTS.route}
          value={values.routeColor}
          error={errors.routeColor}
          note={notes.route}
          disabled={!canEdit}
          onChange={set('routeColor')}
        />
        {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
        {canEdit ? (
          <Button
            type="submit"
            variant="primary"
            className="justify-self-start"
            disabled={save.isPending}
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan branding'}
          </Button>
        ) : null}
      </form>
      <BrandingPreview
        name={live.name}
        logoUrl={previewLogo}
        primaryColor={live.primaryColor}
        routeColor={live.routeColor}
      />
    </div>
  );
}

export function BrandingPanel({ venueId }: { venueId: VenueId }) {
  const settings = useDisplaySettings(venueId);
  const venue = useVenueDetail(venueId);
  const role = useRole();
  if (settings.isPending || venue.isPending) return <Skeleton className="h-96 w-full" />;
  if (settings.error || venue.error) {
    return <p className="text-danger">{(settings.error ?? venue.error)?.message}</p>;
  }
  if (!settings.data || !venue.data) return null;
  return (
    <BrandingForm key={venueId} venue={venue.data} branding={settings.data.branding} role={role} />
  );
}
