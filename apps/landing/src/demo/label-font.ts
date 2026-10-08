import type { LabelFont } from '@indoor/map-core';
import latin from '@indoor/ui/fonts/atkinson-hyperlegible-latin-700-normal.woff2?url';
import latinExt from '@indoor/ui/fonts/atkinson-hyperlegible-latin-ext-700-normal.woff2?url';

// Rentang sama dengan @font-face Atkinson Hyperlegible di @indoor/ui (styles/fonts.css).
const LATIN = [
  'U+0000-00FF',
  'U+0131',
  'U+0152-0153',
  'U+02BB-02BC',
  'U+02C6',
  'U+02DA',
  'U+02DC',
  'U+0304',
  'U+0308',
  'U+0329',
  'U+2000-206F',
  'U+20AC',
  'U+2122',
  'U+2191',
  'U+2193',
  'U+2212',
  'U+2215',
  'U+FEFF',
  'U+FFFD',
];
const LATIN_EXT = [
  'U+0100-02BA',
  'U+02BD-02C5',
  'U+02C7-02CC',
  'U+02CE-02D7',
  'U+02DD-02FF',
  'U+1D00-1DBF',
  'U+1E00-1E9F',
  'U+1EF2-1EFF',
  'U+2020',
  'U+20A0-20AB',
  'U+20AD-20C0',
  'U+2113',
  'U+2C60-2C7F',
  'U+A720-A7FF',
];

// URL lengkap agar tidak bergantung pada cara MapLibre menyelesaikan path relatif.
const absolute = (url: string) => new URL(url, window.location.href).href;

/** Label peta: Atkinson Hyperlegible tebal, sama dengan Visitor. */
export const LABEL_FONT: LabelFont = {
  name: 'Atkinson Hyperlegible Bold',
  faces: [
    { url: absolute(latin), unicodeRange: LATIN },
    { url: absolute(latinExt), unicodeRange: LATIN_EXT },
  ],
};
