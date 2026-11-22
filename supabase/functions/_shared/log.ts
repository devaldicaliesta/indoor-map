export function logError(source: string, message: string) {
  // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya tempat rincian galat; balasan ke pemanggil sengaja umum.
  console.error(`${source}: ${message}`);
}
