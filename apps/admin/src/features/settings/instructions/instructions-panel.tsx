import {
  type AppRole,
  can,
  DEFAULT_INSTRUCTION_TEMPLATES,
  INSTRUCTION_ACTIONS,
  type InstructionAction,
  type InstructionText,
  type SnapshotLanguage,
  type VenueId,
} from '@indoor/domain';
import { instructionPlaceholders } from '@indoor/routing';
import {
  Button,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { useRole } from '../../../app/auth/can';
import { FormNotice } from '../../auth/auth-layout';
import {
  ACTION_LABELS,
  type InstructionErrors,
  previewInstruction,
  validateInstruction,
} from './instructions-model';
import { useInstructionTemplates, useSaveInstructionTemplates } from './queries';

type Templates = Record<InstructionAction, InstructionText>;

const LANGUAGE_LABELS: Record<SnapshotLanguage, string> = { id: 'Indonesia', en: 'Inggris' };

function TextCell({
  action,
  language,
  text,
  error,
  disabled,
  onChange,
}: {
  action: InstructionAction;
  language: SnapshotLanguage;
  text: InstructionText;
  error: string | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const id = `instruction-${action}-${language}`;
  return (
    <TableCell className="min-w-56 align-top">
      <Input
        id={id}
        aria-label={`${ACTION_LABELS[action]} (${LANGUAGE_LABELS[language]})`}
        value={text[language]}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-note`}
        onChange={(e) => onChange(e.target.value)}
      />
      <p
        id={`${id}-note`}
        className={error ? 'mt-1 text-danger text-sm' : 'mt-1 text-ink-muted text-sm'}
      >
        {error ?? previewInstruction(action, text, language)}
      </p>
    </TableCell>
  );
}

function InstructionsForm({
  venueId,
  templates,
  role,
}: {
  venueId: VenueId;
  templates: Templates;
  role: AppRole | null;
}) {
  const canEdit = role !== null && can(role, 'settings.edit');
  const [values, setValues] = useState<Templates>(templates);
  const save = useSaveInstructionTemplates(venueId);
  const errors = Object.fromEntries(
    INSTRUCTION_ACTIONS.map((action) => [action, validateInstruction(action, values[action])]),
  ) as Record<InstructionAction, InstructionErrors>;
  const invalid = INSTRUCTION_ACTIONS.some((action) => Object.keys(errors[action]).length > 0);
  const changes = INSTRUCTION_ACTIONS.filter(
    (action) =>
      values[action].id !== templates[action].id || values[action].en !== templates[action].en,
  ).map((action): [InstructionAction, InstructionText] => [action, values[action]]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalid || changes.length === 0) return;
    save.mutate(changes, { onSuccess: () => toast.success('Instruksi disimpan') });
  }

  const setText = (action: InstructionAction, language: SnapshotLanguage, value: string) =>
    setValues((v) => ({ ...v, [action]: { ...v[action], [language]: value } }));
  const isDefault = (action: InstructionAction) =>
    values[action].id === DEFAULT_INSTRUCTION_TEMPLATES[action].id &&
    values[action].en === DEFAULT_INSTRUCTION_TEMPLATES[action].en;
  // Hanya mengisi formulir; tersimpan lewat "Simpan instruksi" seperti perubahan lain.
  const reset = (action: InstructionAction) =>
    setValues((v) => ({ ...v, [action]: DEFAULT_INSTRUCTION_TEMPLATES[action] }));

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <p className="max-w-prose text-ink-muted text-sm">
        Teks setiap langkah rute di Visitor dan test route. Teks Inggris yang kosong memakai teks
        Indonesia. Di bawah setiap isian tampil contoh kalimatnya.
      </p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aksi</TableHead>
              <TableHead>Placeholder</TableHead>
              <TableHead>Bahasa Indonesia</TableHead>
              <TableHead>Bahasa Inggris</TableHead>
              {canEdit ? <TableHead className="text-right">Aksi</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {INSTRUCTION_ACTIONS.map((action) => (
              <TableRow key={action}>
                <TableCell className="align-top font-bold">{ACTION_LABELS[action]}</TableCell>
                <TableCell className="align-top font-mono text-sm">
                  {instructionPlaceholders(action)
                    .map((name) => `{${name}}`)
                    .join(' ')}
                </TableCell>
                {(['id', 'en'] as const).map((language) => (
                  <TextCell
                    key={language}
                    action={action}
                    language={language}
                    text={values[action]}
                    error={errors[action][language]}
                    disabled={!canEdit}
                    onChange={(value) => setText(action, language, value)}
                  />
                ))}
                {canEdit ? (
                  <TableCell className="text-right align-top">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Kembalikan ${ACTION_LABELS[action]} ke bawaan`}
                      disabled={isDefault(action)}
                      onClick={() => reset(action)}
                    >
                      Bawaan
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
      {canEdit ? (
        <Button
          type="submit"
          variant="primary"
          className="justify-self-start"
          disabled={save.isPending || invalid || changes.length === 0}
        >
          {save.isPending ? 'Menyimpan…' : 'Simpan instruksi'}
        </Button>
      ) : null}
      {canEdit ? (
        <Button
          type="button"
          variant="ghost"
          className="justify-self-start"
          disabled={INSTRUCTION_ACTIONS.every(isDefault)}
          onClick={() => setValues(DEFAULT_INSTRUCTION_TEMPLATES)}
        >
          Semua ke bawaan
        </Button>
      ) : null}
    </form>
  );
}

export function InstructionsPanel({ venueId }: { venueId: VenueId }) {
  const templates = useInstructionTemplates(venueId);
  const role = useRole();
  if (templates.isPending) return <Skeleton className="h-96 w-full" />;
  if (templates.error) return <p className="text-danger">{templates.error.message}</p>;
  return (
    <InstructionsForm key={venueId} venueId={venueId} templates={templates.data} role={role} />
  );
}
