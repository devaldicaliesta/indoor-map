import type { AnalyticsEvent, VenueId } from '@indoor/domain';
import { data } from '../../data/client';

const OPT_OUT_KEY = 'panduarah.analytics.optOut';
const NOTICE_KEY = 'panduarah.analytics.noticeSeen';
export const ANALYTICS_FLUSH_MS = 10_000;
export const ANALYTICS_FLUSH_SIZE = 20;

const listeners = new Set<() => void>();

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

export interface PrivacyChoice {
  optedOut: boolean;
  noticeSeen: boolean;
}

let choice: PrivacyChoice = { optedOut: read(OPT_OUT_KEY), noticeSeen: read(NOTICE_KEY) };

export function privacyChoice(): PrivacyChoice {
  return choice;
}

export function subscribePrivacy(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function choosePrivacy(optedOut: boolean) {
  write(OPT_OUT_KEY, optedOut);
  write(NOTICE_KEY, true);
  choice = { optedOut, noticeSeen: true };
  if (optedOut) queue.clear();
  for (const listener of listeners) listener();
}

class AnalyticsQueue {
  private venueId: VenueId | null = null;
  private events: AnalyticsEvent[] = [];
  private timer: number | undefined;

  push(venueId: VenueId, event: AnalyticsEvent) {
    if (this.venueId && this.venueId !== venueId) this.flush();
    this.venueId = venueId;
    this.events.push(event);
    if (this.events.length >= ANALYTICS_FLUSH_SIZE) this.flush();
    else if (this.timer === undefined) {
      this.timer = window.setTimeout(() => this.flush(), ANALYTICS_FLUSH_MS);
    }
  }

  flush(keepalive = false) {
    window.clearTimeout(this.timer);
    this.timer = undefined;
    const venueId = this.venueId;
    const events = this.events.splice(0);
    if (!venueId || !events.length) return;
    void data.analytics.send(venueId, events, { keepalive });
  }

  clear() {
    window.clearTimeout(this.timer);
    this.timer = undefined;
    this.events = [];
  }
}

const queue = new AnalyticsQueue();

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => queue.flush(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') queue.flush(true);
  });
}

export function track(venueId: VenueId, event: AnalyticsEvent) {
  queue.push(venueId, event);
}
