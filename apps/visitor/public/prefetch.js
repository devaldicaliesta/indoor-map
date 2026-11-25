// Snapshot venue diminta sejak HTML, bersamaan dengan bundel aplikasi; aplikasi memakai respons ini
// sekali (src/data/prefetch.ts). Berkas terpisah, bukan script inline, agar CSP Visitor cukup
// `script-src 'self'`. Alamat API dari atribut data-api tag script di index.html.
(() => {
  var api = document.currentScript ? document.currentScript.dataset.api || '' : '';
  var base = `${api.replace(/\/+$/, '')}/storage/v1/object/public/snapshots/`;
  var isId = (value) => /^[0-9a-f-]{36}$/i.test(value);
  var latest = (venue) => {
    var url = `${base + venue}/latest.json`;
    var response = fetch(url, { cache: 'no-cache' });
    // Galat jaringan dilaporkan saat respons dipakai; tanpa pemakai tidak perlu dilaporkan.
    response.catch(() => {});
    window.__snapshotPrefetch = { url: url, response: response };
  };
  var query = new URLSearchParams(location.search);
  var path = /^\/v\/([^/?#]+)/.exec(location.pathname);
  var venue = path ? path[1] : query.get('venue') || query.get('v');
  if (!venue) return;
  if (isId(venue)) return latest(venue);
  // Alamat slug (`/v/demo`): penunjuk lebih dulu, lalu latest.json begitu id venue diketahui.
  if (!path || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(venue)) return;
  var url = `${base}slugs/${venue}.json`;
  var pointer = fetch(url, { cache: 'no-cache' });
  window.__slugPrefetch = { url: url, response: pointer };
  pointer
    .then((response) => (response.ok ? response.clone().json() : null))
    .then((found) => found && isId(found.venueId) && latest(found.venueId))
    .catch(() => {});
})();
