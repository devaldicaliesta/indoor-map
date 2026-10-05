// Target pengukuran: paket instalasi (deploy/) agar yang diukur build produksi + service worker.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} wajib diisi (lihat tests/perf/README.md).`);
  return value;
}

export const perfEnv = {
  apiUrl: required('PERF_API_URL'),
  anonKey: required('PERF_ANON_KEY'),
  adminUrl: required('PERF_ADMIN_URL'),
  visitorUrl: required('PERF_VISITOR_URL'),
  email: required('PERF_EMAIL'),
  password: required('PERF_PASSWORD'),
};
