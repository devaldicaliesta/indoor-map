import {
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
  type DataColumn,
  DataTable,
  type FilterDef,
  Input,
  queryRows,
  Skeleton,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { useCan } from '../../../app/auth/can';
import { useTableState } from '../../../hooks/use-table-state';
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

const FILTERS: FilterDef[] = [
  {
    kind: 'select',
    key: 'status',
    label: 'Status',
    allLabel: 'Semua instruksi',
    options: [
      { value: 'diubah', label: 'Diubah dari bawaan' },
      { value: 'bawaan', label: 'Sama dengan bawaan' },
    ],
  },
];

const placeholders = (action: InstructionAction) =>
  instructionPlaceholders(action).map((name) => `{${name}}`);

function TextField({
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
    <>
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
    </>
  );
}

function InstructionsForm({ venueId, templates }: { venueId: VenueId; templates: Templates }) {
  const canEdit = useCan('settings.edit');
  const [values, setValues] = useState<Templates>(templates);
  const table = useTableState({ filters: FILTERS });
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

  const hasErrors = (action: InstructionAction) => Object.keys(errors[action]).length > 0;
  const result = queryRows(INSTRUCTION_ACTIONS, table.state, {
    text: (action) => [
      ACTION_LABELS[action],
      ...placeholders(action),
      ...Object.values(values[action]),
    ],
    filters: {
      status: (action, selected) => selected.includes(isDefault(action) ? 'bawaan' : 'diubah'),
    },
  });
  // Isian yang salah bisa tersembunyi oleh cari/filter; tanpa pesan ini tombol simpan mati tanpa alasan.
  const hiddenErrors = INSTRUCTION_ACTIONS.filter(
    (action) => hasErrors(action) && !result.rows.includes(action),
  );

  const columns: DataColumn<InstructionAction>[] = [
    {
      id: 'action',
      header: 'Aksi',
      className: 'align-top font-bold',
      cell: (action) => ACTION_LABELS[action],
    },
    {
      id: 'placeholders',
      header: 'Placeholder',
      className: 'align-top font-mono text-sm',
      cell: (action) => placeholders(action).join(' '),
    },
    ...(['id', 'en'] as const).map(
      (language): DataColumn<InstructionAction> => ({
        id: language,
        header: `Bahasa ${LANGUAGE_LABELS[language]}`,
        className: 'min-w-56 align-top',
        cell: (action) => (
          <TextField
            action={action}
            language={language}
            text={values[action]}
            error={errors[action][language]}
            disabled={!canEdit}
            onChange={(value) => setText(action, language, value)}
          />
        ),
      }),
    ),
    ...(canEdit
      ? [
          {
            id: 'reset',
            header: 'Aksi',
            className: 'text-right align-top',
            cell: (action: InstructionAction) => (
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
            ),
          },
        ]
      : []),
  ];

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <p className="max-w-prose text-ink-muted text-sm">
        Teks setiap langkah rute di Visitor dan test route. Teks Inggris yang kosong memakai teks
        Indonesia. Di bawah setiap isian tampil contoh kalimatnya.
      </p>
      <DataTable
        label="Template instruksi"
        columns={columns}
        rows={result.rows}
        rowKey={(action) => action}
        total={result.total}
        table={table}
        search={{ placeholder: 'Cari aksi, placeholder, atau teks instruksi' }}
        filters={FILTERS}
        empty={null}
      />
      {hiddenErrors.length > 0 ? (
        <FormNotice tone="error">
          Isian {hiddenErrors.map((action) => ACTION_LABELS[action]).join(', ')} belum benar dan
          sedang tersembunyi oleh cari atau filter.
        </FormNotice>
      ) : null}
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
  if (templates.isPending) return <Skeleton className="h-96 w-full" />;
  if (templates.error) return <p className="text-danger">{templates.error.message}</p>;
  return <InstructionsForm key={venueId} venueId={venueId} templates={templates.data} />;
}
