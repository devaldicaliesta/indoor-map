import { describe, expect, it } from 'vitest';
import { APP_ROLES, AppRoleSchema, LanguageCodeSchema } from '../src';

describe('AppRoleSchema', () => {
  it('berisi lima role sesuai spesifikasi', () => {
    expect(APP_ROLES).toEqual(['super_admin', 'admin', 'editor', 'operator', 'viewer']);
  });

  it('menolak role yang tidak dikenal', () => {
    expect(AppRoleSchema.safeParse('owner').success).toBe(false);
  });
});

describe('LanguageCodeSchema', () => {
  it('hanya Bahasa Indonesia dan Inggris', () => {
    expect(LanguageCodeSchema.options).toEqual(['id', 'en']);
  });
});
