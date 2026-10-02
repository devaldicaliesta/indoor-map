import { aliasKey } from '@indoor/data';
import {
  ALIAS_MAX_LENGTH,
  ALIASES_MAX,
  type AliasTarget,
  checkAliases,
  normalizeAliases,
  type VenueId,
} from '@indoor/domain';
import { Badge } from '@indoor/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Field } from '../../app/components/field';
import { data } from '../../app/data-client';

const aliasesKey = (venueId: VenueId) => ['aliases', venueId] as const;

const PROBLEM_MESSAGES = {
  too_long: `Setiap alias maksimal ${ALIAS_MAX_LENGTH} karakter.`,
  too_many: `Maksimal ${ALIASES_MAX} alias.`,
} as const;

/**
 * Alias pencarian satu sasaran dalam formulir. Disimpan lewat `save(id)` setelah sasarannya
 * tersimpan (sasaran baru baru punya id saat itu); dipakai Visitor setelah publish.
 */
export function useAliasDraft(
  venueId: VenueId,
  kind: AliasTarget['kind'],
  id: string | null,
  ownName: string,
) {
  const queryClient = useQueryClient();
  const all = useQuery({
    queryKey: aliasesKey(venueId),
    queryFn: () => data.aliases.listByVenue(venueId),
  }).data;
  const stored = id ? (all?.get(aliasKey({ kind, id } as AliasTarget)) ?? []) : [];
  const [text, setText] = useState<string | null>(null);
  // Isian awal diambil sekali setelah alias termuat, agar ketikan pengguna tidak tertimpa.
  useEffect(() => {
    if (text === null && all) setText(stored.join(', '));
  }, [all, text, stored]);
  const keywords = normalizeAliases(text ?? '', ownName);
  const problems = checkAliases(keywords);
  const changed = keywords.join('\n') !== stored.join('\n');

  return {
    text: text ?? '',
    setText,
    keywords,
    error: problems[0] ? PROBLEM_MESSAGES[problems[0]] : undefined,
    async save(targetId: string) {
      if (!changed && id) return;
      if (keywords.length === 0 && !id) return;
      await data.aliases.set(venueId, { kind, id: targetId } as AliasTarget, keywords);
      await queryClient.invalidateQueries({ queryKey: aliasesKey(venueId) });
    },
  };
}

export function AliasField({
  id,
  draft,
  disabled,
}: {
  id: string;
  draft: ReturnType<typeof useAliasDraft>;
  disabled: boolean;
}) {
  return (
    <Field
      id={id}
      label="Alias pencarian (opsional)"
      hint="Kata lain yang dipakai pengunjung, dipisah koma. Berlaku di Visitor setelah publish."
      error={draft.error}
    >
      <input
        id={id}
        value={draft.text}
        disabled={disabled}
        placeholder="Misalnya: rontgen, X-ray"
        aria-invalid={draft.error ? true : undefined}
        onChange={(e) => draft.setText(e.target.value)}
        className="h-(--control-height) w-full rounded-sm border border-ink-muted bg-surface px-3 text-ink disabled:cursor-not-allowed disabled:opacity-50"
      />
      {draft.keywords.length ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {draft.keywords.map((keyword) => (
            <Badge key={keyword}>{keyword}</Badge>
          ))}
        </div>
      ) : null}
    </Field>
  );
}
