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
const TABLE_USERS = Number(__ENV.LOAD_TABLE_USERS || 10);

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
    // Admin membuka tabel server (T-503): cari, filter, dan pindah halaman di Lokasi,
    // Penutupan, Riwayat publish, dan Log audit.
    tables: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: TABLE_USERS },
        { duration: HOLD, target: TABLE_USERS },
      ],
      exec: 'tables',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:api}': ['p(95)<1000'],
    'http_req_duration{kind:page}': ['p(95)<1000'],
    'http_req_duration{kind:snapshot}': ['p(95)<2000'],
    'http_req_duration{kind:graph}': ['p(95)<5000'],
    // Satu perubahan cari/filter/halaman tabel server < 500 ms (T-503).
    'http_req_duration{kind:table}': ['p(95)<500'],
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
  // Graf jalur terpisah (snapshot ringan); Visitor memuatnya di latar setelah peta tampil.
  const graphPath = snapshot.json('graphPath');
  if (graphPath) {
    const graph = http.get(`${API}/storage/v1/object/public/snapshots/${VENUE}/${graphPath}`, {
      headers: gzip,
      tags: { kind: 'graph' },
    });
    check(graph, { 'graf 200': (r) => r.status === 200 });
  }
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

const LOCATION_COLUMNS =
  'id,venue_id,location_type_id,code,name,description,logo_path,photo_paths,status,custom_fields,opening_date,' +
  'opening_hours(weekday,special_date,opens_at,closes_at,is_closed),location_categories(category_id),' +
  'location_units(feature_id,is_primary,features(unit_code,floor_id,floors(name,building_id,buildings!floors_building_same_venue(name))))';
const QUERIES = ['', 'lab', 'poli', 'kafe', 'toilet', 'gf-'];

/** Satu halaman (25 baris) tabel server beserta jumlah totalnya, seperti `listPage` Admin. */
function tablePage(data, fn, args, select, order, page) {
  const offset = (page - 1) * 25;
  const res = http.post(
    `${API}/rest/v1/rpc/${fn}?select=${encodeURIComponent(select)}&order=${order}&offset=${offset}&limit=25`,
    JSON.stringify(args),
    {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${data.token}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
        ...gzip,
      },
      tags: { kind: 'table' },
    },
  );
  check(res, { [`${fn} 200`]: (r) => r.status === 200 || r.status === 206 });
}

/** Admin di tabel server: cari, tambah filter, pindah halaman, lalu tabel lain. */
export function tables(data) {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const locations = {
    p_venue_id: VENUE,
    p_query: q,
    p_statuses: [],
    p_category_id: null,
    p_type_id: null,
    p_building: null,
    p_floor_id: null,
    p_unlinked_only: false,
  };
  tablePage(data, 'search_locations', locations, LOCATION_COLUMNS, 'name.asc,id.asc', 1);
  sleep(1 + Math.random());
  const active = { ...locations, p_statuses: ['active'] };
  tablePage(data, 'search_locations', active, LOCATION_COLUMNS, 'name.asc,id.asc', 1);
  sleep(1 + Math.random());
  tablePage(data, 'search_locations', active, LOCATION_COLUMNS, 'name.asc,id.asc', 2);
  sleep(1 + Math.random());
  const period = { p_from: null, p_to: null, p_time_zone: 'Asia/Jakarta' };
  tablePage(
    data,
    'search_closures',
    { p_venue_id: VENUE, p_query: '', p_states: ['active', 'scheduled'], ...period },
    'id,feature_id,edge_id,connector_id,reason,starts_at,ends_at',
    'starts_at.desc,id.asc',
    1,
  );
  tablePage(
    data,
    'search_publications',
    { p_venue_id: VENUE, p_query: '', ...period },
    'version,published_at,notes,origin,source_version,is_active',
    'version.desc',
    1,
  );
  tablePage(
    data,
    'search_audit_events',
    { p_query: q, p_actions: null, p_user_id: null, ...period },
    'id,occurred_at,action,user_id,entity,entity_id,details',
    'occurred_at.desc,id.desc',
    1,
  );
  sleep(2 + Math.random() * 3);
}
