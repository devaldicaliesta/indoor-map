// Bagian kecil WebCrypto dan pengodean teks yang dipakai `license.ts`. Domain sengaja tanpa
// lib DOM; API ini tersedia sama di browser, Deno (Edge Function), dan Node.
interface CryptoKey {
  readonly algorithm: { name: string };
  readonly extractable: boolean;
  readonly type: 'public' | 'private' | 'secret';
  readonly usages: string[];
}

interface CryptoKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}

type KeyUsage = 'sign' | 'verify';

interface SubtleCrypto {
  importKey(
    format: 'raw' | 'pkcs8' | 'spki',
    keyData: Uint8Array<ArrayBuffer>,
    algorithm: { name: 'Ed25519' },
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey>;
  exportKey(format: 'raw' | 'pkcs8' | 'spki', key: CryptoKey): Promise<ArrayBuffer>;
  generateKey(
    algorithm: { name: 'Ed25519' },
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKeyPair | CryptoKey>;
  sign(
    algorithm: { name: 'Ed25519' },
    key: CryptoKey,
    data: Uint8Array<ArrayBuffer>,
  ): Promise<ArrayBuffer>;
  verify(
    algorithm: { name: 'Ed25519' },
    key: CryptoKey,
    signature: Uint8Array<ArrayBuffer>,
    data: Uint8Array<ArrayBuffer>,
  ): Promise<boolean>;
}

declare var crypto: { readonly subtle: SubtleCrypto };

declare class TextEncoder {
  encode(input?: string): Uint8Array<ArrayBuffer>;
}

declare function atob(data: string): string;
declare function btoa(data: string): string;
