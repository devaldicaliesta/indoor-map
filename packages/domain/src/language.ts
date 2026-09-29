import { z } from 'zod';

export const LANGUAGE_CODES = ['id', 'en'] as const;
export const LanguageCodeSchema = z.enum(LANGUAGE_CODES);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
