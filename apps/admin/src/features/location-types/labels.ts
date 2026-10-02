import type { CustomFieldProblem, FieldType } from '@indoor/domain';

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Teks',
  number: 'Angka',
  select: 'Pilihan',
  opening_hours: 'Jam operasional (teks)',
  image: 'Gambar',
  link: 'Tautan',
};

export const FIELD_PROBLEM_MESSAGES: Record<CustomFieldProblem, string> = {
  label_required: 'Label wajib diisi.',
  label_too_long: 'Label maksimal 60 karakter.',
  options_required: 'Isi minimal satu opsi, satu per baris.',
  options_duplicate: 'Opsi tidak boleh sama.',
  key_duplicate: 'Kunci sudah dipakai field lain di tipe ini.',
};
