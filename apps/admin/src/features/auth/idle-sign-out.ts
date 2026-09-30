import { isSessionIdle } from '@indoor/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { data } from '../../app/data-client';
import { NOTICES, setLoginNotice } from './navigation-notice';

// Waktu aktivitas terakhir dibagi antar-tab lewat localStorage (bukan token).
const LAST_ACTIVITY_KEY = 'indoor-admin.last-activity';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const WRITE_INTERVAL_MS = 15_000;
const CHECK_INTERVAL_MS = 30_000;

function readLastActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function markActivity(now: number = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Penyimpanan diblokir: batas waktu tetap dijaga server (inactivity_timeout).
  }
}

function clearActivity() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Diabaikan; lihat markActivity.
  }
}

/** Aktivitas di tab mana pun menunda keluar otomatis. */
export function useIdleSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastWrite = 0;
    let signingOut = false;

    function onActivity() {
      const now = Date.now();
      if (now - lastWrite < WRITE_INTERVAL_MS) return;
      lastWrite = now;
      markActivity(now);
    }

    async function check() {
      const last = readLastActivity();
      if (signingOut || last === null || !isSessionIdle(last, Date.now())) return;
      signingOut = true;
      clearActivity();
      setLoginNotice(NOTICES.idle);
      await data.auth.signOut().catch(() => undefined);
      queryClient.clear();
      navigate('/login', { replace: true });
    }

    if (readLastActivity() === null) markActivity();
    void check();
    const timer = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    return () => {
      window.clearInterval(timer);
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
    };
  }, [navigate, queryClient]);
}
