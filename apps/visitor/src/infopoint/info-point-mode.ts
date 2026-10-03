import { createContext, useContext } from 'react';

/** Layar Info Point yang sedang tampil; `null` di Visitor biasa. */
export interface InfoPointMode {
  code: string;
}

export const InfoPointModeContext = createContext<InfoPointMode | null>(null);

/** Di Info Point titik asal tetap dan pencarian memakai keyboard layar. */
export const useInfoPointMode = () => useContext(InfoPointModeContext);
