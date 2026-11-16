import type { SnapshotCategory, SnapshotLocation } from './snapshot';

const english = (language: string | undefined) => language === 'en';

export function categoryName(
  category: Pick<SnapshotCategory, 'name' | 'nameEn'>,
  language: string | undefined,
): string {
  return english(language) && category.nameEn?.trim() ? category.nameEn : category.name;
}

export function locationDescription(
  location: Pick<SnapshotLocation, 'description' | 'descriptionEn'>,
  language: string | undefined,
): string | null {
  return english(language) && location.descriptionEn?.trim()
    ? location.descriptionEn
    : location.description;
}
