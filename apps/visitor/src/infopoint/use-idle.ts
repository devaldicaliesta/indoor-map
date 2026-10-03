import { useEffect, useRef } from 'react';

const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/** Memanggil `onIdle` setelah `seconds` tanpa sentuhan; hitungan mulai lagi setelah dipanggil. */
export function useIdle(seconds: number, onIdle: () => void) {
  const callback = useRef(onIdle);
  callback.current = onIdle;
  useEffect(() => {
    let timer = window.setTimeout(fire, seconds * 1000);
    function fire() {
      callback.current();
      timer = window.setTimeout(fire, seconds * 1000);
    }
    function reset() {
      window.clearTimeout(timer);
      timer = window.setTimeout(fire, seconds * 1000);
    }
    for (const event of ACTIVITY) window.addEventListener(event, reset, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY) window.removeEventListener(event, reset);
    };
  }, [seconds]);
}
