// Uji beban paket instalasi: 200 pengunjung + 20 pengguna Admin bersamaan (NFR-CAP-01).
// Dijalankan lewat Docker (lihat tests/perf/README.md); nilai dari variabel lingkungan LOAD_*.
import { check, sleep } from 'k6';
import http from 'k6/http';

const API = __ENV.LOAD_API_URL;
const VISITOR = __ENV.LOAD_VISITOR_URL;
const ANON = __ENV.LOAD_ANON_KEY;
const VENUE = __ENV.LOAD_VENUE_ID;
const LOCATION = __ENV.LOAD_LOCATION_ID;
const HOLD = __ENV.LOAD_HOLD || '2m';

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    // Pengunjung datang bertahap dalam satu menit, lalu 200 orang aktif bersamaan.
    visitors: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 200 },
        { duration: HOLD, target: 200 },
      ],
      exec: 'visitor',
    },
    admins: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 20 },
        { duration: HOLD, target: 20 },
      ],
      exec: 'admin',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:api}': ['p(95)<1000'],
    'http_req_duration{kind:page}': ['p(95)<1000'],
    'http_req_duration{kind:snapshot}': ['p(95)<5000'],
  },
};

const anonHeaders = { apikey: ANON, Authorization: `Bearer ${ANON}` };
const gzip = { 'Accept-Encoding': 'gzip, zstd' };

export function setup() {
  const login = http.post(
    `${API}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: __ENV.LOAD_EMAIL, password: __ENV.LOAD_PASSWORD }),
    { headers: { apikey: ANON, 'Content-Type': 'application/json' } },
  );
  check(login, { 'admin masuk': (r) => r.status === 200 });
  return { token: login.json('access_token') };
}

/** Pengunjung baru tanpa cache: halaman, snapshot venue, penutupan aktif, lalu membaca peta. */
export function visitor() {
  const page = http.get(`${VISITOR}/v/${VENUE}`, { headers: gzip, tags: { kind: 'page' } });
  check(page, { 'halaman 200': (r) => r.status === 200 });
  const snapshot = http.get(`${API}/storage/v1/object/public/snapshots/${VENUE}/latest.json`, {
    headers: gzip,
    tags: { kind: 'snapshot' },
  });
  check(snapshot, { 'snapshot 200': (r) => r.status === 200 });
  const now = new Date().toISOString();
  const closures = http.get(
    `${API}/rest/v1/closures?select=id,ends_at&venue_id=eq.${VENUE}&or=(ends_at.is.null,ends_at.gt."${now}")`,
    { headers: { ...anonHeaders, ...gzip }, tags: { kind: 'api' } },
  );
  check(closures, { 'penutupan 200': (r) => r.status === 200 });
  sleep(10 + Math.random() * 20);
}

/** Admin: daftar venue, fitur satu lantai, lokasi, dan menyimpan perubahan deskripsi lokasi. */
export function admin(data) {
  const headers = { apikey: ANON, Authorization: `Bearer ${data.token}`, ...gzip };
  const api = { headers, tags: { kind: 'api' } };
  check(http.get(`${API}/rest/v1/venues?select=id,name`, api), {
    'venue 200': (r) => r.status === 200,
  });
  const floors = http.get(`${API}/rest/v1/floors?select=id&venue_id=eq.${VENUE}&limit=1`, api);
  const floor = floors.json('0.id');
  check(http.get(`${API}/rest/v1/features?select=id,kind,geom&floor_id=eq.${floor}`, api), {
    'fitur 200': (r) => r.status === 200,
  });
  check(http.get(`${API}/rest/v1/locations?select=id,name&venue_id=eq.${VENUE}&limit=100`, api), {
    'lokasi 200': (r) => r.status === 200,
  });
  const saved = http.patch(
    `${API}/rest/v1/locations?id=eq.${LOCATION}`,
    JSON.stringify({ description: `Uji beban ${Date.now()}` }),
    { headers: { ...headers, 'Content-Type': 'application/json' }, tags: { kind: 'api' } },
  );
  check(saved, { 'simpan 204': (r) => r.status === 204 });
  sleep(3 + Math.random() * 4);
}
