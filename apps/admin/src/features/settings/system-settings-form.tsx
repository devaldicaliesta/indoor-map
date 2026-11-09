import { APP_ROLES, type AppRole, type LanguageCode, type SystemSettings } from '@indoor/domain';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@indoor/ui';
import { type ChangeEvent, type FormEvent, type ReactNode, useState } from 'react';
import { Field } from '../../app/components/field';
import { TimezoneSelect } from '../../app/components/timezone-select';
import { ROLE_LABELS } from '../../app/navigation';
import {
  useSaveSystemSettings,
  useSendTestEmail,
  useSmtpPasswordIsSet,
  useSystemSettings,
} from './queries';
import {
  type SystemFormErrors,
  type SystemFormValues,
  type SystemTextField,
  toFormValues,
  toPatch,
  validate,
} from './system-form-model';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-line border-t pt-4 first:border-t-0 first:pt-0">
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-ink-muted">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Form({ settings, passwordIsSet }: { settings: SystemSettings; passwordIsSet: boolean }) {
  const [values, setValues] = useState<SystemFormValues>(() => toFormValues(settings));
  const [errors, setErrors] = useState<SystemFormErrors>({});
  const save = useSaveSystemSettings();
  const testEmail = useSendTestEmail();

  const set =
    <K extends keyof SystemFormValues>(key: K) =>
    (value: SystemFormValues[K]) =>
      setValues((current) => ({ ...current, [key]: value }));
  const input = (key: SystemTextField) => ({
    id: key,
    value: values[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => set(key)(event.target.value),
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate(
      { patch: toPatch(values), password: values.smtpPassword },
      {
        onSuccess: () => {
          setValues((current) => ({ ...current, smtpPassword: '' }));
          toast.success('Pengaturan sistem tersimpan');
        },
        onError: (error) =>
          toast.error('Pengaturan tidak disimpan', { description: error.message }),
      },
    );
  }

  function sendTest() {
    testEmail.mutate(undefined, {
      onSuccess: (sentTo) =>
        toast.success('Email uji terkirim', { description: `Periksa kotak masuk ${sentTo}.` }),
      onError: (error) => toast.error('Email uji gagal', { description: error.message }),
    });
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={submit} noValidate>
      <Section
        title="Visitor"
        description="Dipakai di semua QR titik asal, tautan bagikan, dan URL Info Point."
      >
        <div className="col-span-2">
          <Field
            id="publicVisitorUrl"
            label="URL publik Visitor"
            hint="Alamat yang dibuka pengunjung, tanpa / di akhir."
            error={errors.publicVisitorUrl}
          >
            <Input
              {...input('publicVisitorUrl')}
              placeholder="https://peta.rs-harapan.id"
              className="font-mono"
            />
          </Field>
        </div>
        <Field id="defaultTimezone" label="Zona waktu default" error={errors.defaultTimezone}>
          <TimezoneSelect
            id="defaultTimezone"
            value={values.defaultTimezone}
            onChange={set('defaultTimezone')}
          />
        </Field>
        <Field id="defaultLanguage" label="Bahasa default">
          <Select
            value={values.defaultLanguage}
            onValueChange={(v) => set('defaultLanguage')(v as LanguageCode)}
          >
            <SelectTrigger id="defaultLanguage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section
        title="Peta dasar (opsional)"
        description="Jalan dan lingkungan di sekitar gedung di bawah peta Visitor, dari server tile XYZ yang disediakan klien. Kosongkan agar Visitor tetap berjalan tanpa internet. Berlaku setelah publish berikutnya."
      >
        <div className="col-span-2">
          <Field
            id="basemapTileUrl"
            label="URL tile"
            hint="Contoh: https://tile.openstreetmap.org/{z}/{x}/{y}.png. Pastikan izin pemakaian server tile."
            error={errors.basemapTileUrl}
          >
            <Input
              {...input('basemapTileUrl')}
              placeholder="https://tile.contoh.id/{z}/{x}/{y}.png"
              className="font-mono"
            />
          </Field>
        </div>
        <div className="col-span-2">
          <Field id="basemapAttribution" label="Atribusi" error={errors.basemapAttribution}>
            <Input {...input('basemapAttribution')} placeholder="© OpenStreetMap contributors" />
          </Field>
        </div>
      </Section>

      <Section
        title="Server email (SMTP)"
        description="Untuk email sistem seperti undangan dan email uji."
      >
        <Field id="smtpHost" label="Host" error={errors.smtpHost}>
          <Input {...input('smtpHost')} placeholder="smtp.rs-harapan.id" className="font-mono" />
        </Field>
        <Field
          id="smtpPort"
          label="Port"
          hint="587 (STARTTLS) atau 465 (TLS)."
          error={errors.smtpPort}
        >
          <Input {...input('smtpPort')} inputMode="numeric" className="font-mono" />
        </Field>
        <Field id="smtpUsername" label="Username">
          <Input {...input('smtpUsername')} autoComplete="off" />
        </Field>
        <Field
          id="smtpPassword"
          label="Password"
          hint={passwordIsSet ? 'Tersimpan aman. Kosongkan jika tidak diubah.' : 'Belum diisi.'}
        >
          <Input
            {...input('smtpPassword')}
            type="password"
            autoComplete="new-password"
            placeholder={passwordIsSet ? '•••••••• tersimpan' : ''}
          />
        </Field>
        <div className="col-span-2">
          <Field id="smtpFrom" label="Pengirim" error={errors.smtpFrom}>
            <Input {...input('smtpFrom')} placeholder="Peta RS Harapan <noreply@rs-harapan.id>" />
          </Field>
        </div>
      </Section>

      <Section
        title="Privasi data"
        description="Log audit (masuk, perubahan role, publish, export dan hapus data akun) disimpan selama masa ini, lalu dihapus otomatis setiap malam. Sesuaikan dengan kebijakan retensi instansi Anda."
      >
        <Field
          id="auditRetentionDays"
          label="Masa simpan log audit (hari)"
          hint="30–3650 hari. Bawaan 365 hari."
          error={errors.auditRetentionDays}
        >
          <Input {...input('auditRetentionDays')} inputMode="numeric" className="font-mono" />
        </Field>
      </Section>

      <Section
        title="Verifikasi dua langkah"
        description="Role yang dicentang wajib memasukkan kode aplikasi autentikator (TOTP) setiap masuk. Pengguna yang belum punya aplikasi diminta mendaftarkannya saat masuk berikutnya."
      >
        <fieldset className="col-span-2 grid gap-2">
          <legend className="sr-only">Role wajib verifikasi dua langkah</legend>
          {APP_ROLES.map((role) => (
            <RoleCheckbox
              key={role}
              role={role}
              checked={values.mfaRequiredRoles.includes(role)}
              onChange={(checked) =>
                set('mfaRequiredRoles')(
                  APP_ROLES.filter((r) =>
                    r === role ? checked : values.mfaRequiredRoles.includes(r),
                  ),
                )
              }
            />
          ))}
          <p className="text-ink-muted text-sm">
            Mewajibkan role Anda sendiri hanya bisa setelah 2FA akun Anda aktif (menu akun →
            Keamanan akun).
          </p>
        </fieldset>
      </Section>

      <div className="flex items-center gap-2 border-line border-t pt-4">
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {save.isPending ? 'Menyimpan…' : 'Simpan pengaturan'}
        </Button>
        <Button type="button" onClick={sendTest} disabled={testEmail.isPending}>
          {testEmail.isPending ? 'Mengirim…' : 'Kirim email uji'}
        </Button>
        <span className="text-ink-muted text-sm">
          Email uji memakai pengaturan yang sudah disimpan.
        </span>
      </div>
    </form>
  );
}

function RoleCheckbox({
  role,
  checked,
  onChange,
}: {
  role: AppRole;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        className="size-4 accent-ink"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {ROLE_LABELS[role]}
    </label>
  );
}

export function SystemSettingsForm() {
  const settings = useSystemSettings();
  const password = useSmtpPasswordIsSet();
  if (settings.isPending || password.isPending) return <Skeleton className="h-96 max-w-3xl" />;
  if (settings.error) return <p className="text-danger">{settings.error.message}</p>;
  return (
    <Form
      key={settings.data.updatedAt}
      settings={settings.data}
      passwordIsSet={password.data === true}
    />
  );
}
