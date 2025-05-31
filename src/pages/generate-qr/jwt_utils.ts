import { toByteArray } from 'base64-js';
import { BerReader } from 'asn1';

import {
  base64url,
  generateKeyPair,
  exportJWK,
  SignJWT,
  importJWK,
  type JWTPayload,
  type JWK,
} from 'jose';

import { sha256 } from '@noble/hashes/sha256';

// Convert a string to an array of BigInts
export function stringToPaddedBigIntArray(
  s: string,
  padLength: number
): bigint[] {
  let values = Array.from(s).map((char) => BigInt(char.charCodeAt(0)));
  while (values.length < padLength) {
    values.push(0n);
  }
  return values;
}

// Convert a string to an array of BigInts with k limbs of n bits
export function bigintToLimbs(x: bigint, n: number, k: number): bigint[] {
  let mod: bigint = 1n;
  for (let idx = 0; idx < n; idx++) {
    mod = mod * 2n;
  }

  let ret: bigint[] = [];
  let x_temp: bigint = x;
  for (let idx = 0; idx < k; idx++) {
    ret.push(x_temp % mod);
    x_temp = x_temp / mod;
  }
  return ret;
}

// Convert a buffer to a BigInt
export function bufferToBigInt(buffer: Buffer) {
  // Convert the buffer to a hexadecimal string then to BigInt.
  return BigInt('0x' + buffer.toString('hex'));
}

// Convert a base64 string to a BigInt
export function base64ToBigInt(base64Str: string) {
  const buffer = Buffer.from(base64Str, 'base64');
  const hex = buffer.toString('hex');
  return BigInt('0x' + hex);
}

export function uint8ArrayToBigIntArray(msg: Uint8Array): bigint[] {
  let mpb = [];
  for (const b of msg) {
    mpb.push(BigInt(b));
  }
  return mpb;
}

// Get the x and y coordinates from a PEM public key
// Note that this function is very naive and does not check for OIDs
export function extractXYFromPEM(pk: string) {
  const pk1 = toByteArray(pk);
  const reader = new BerReader(Buffer.from(pk1));
  reader.readSequence();
  reader.readSequence();
  reader.readOID();
  reader.readOID();

  const buffer = reader.readString(3, true)!;

  const xy = buffer.subarray(2);
  const x = xy.subarray(0, 32);
  const y = xy.subarray(32);

  return [bufferToBigInt(x), bufferToBigInt(y)];
}

export async function generateKeyPairJWK() {
  const { publicKey, privateKey } = await generateKeyPair('ES256', {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  return { publicJwk, privateJwk };
}

export function generateSelectiveDisclosureHash(claimArray: string[]) {
  const json = JSON.stringify(claimArray);
  return base64url.encode(sha256(json)).toString();
}

export function generateRandomName(length = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let name = '';
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return name;
}

export function generateRandomROCBirthday() {
  const gregYear = Math.floor(Math.random() * (2023 - 1912 + 1)) + 1912;
  const rocYear = gregYear - 1911;

  const month = Math.floor(Math.random() * 12) + 1;
  const daysInMonth = new Date(gregYear, month, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;

  const rocYearStr = rocYear.toString().padStart(3, '0');
  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');

  return `${rocYearStr}${monthStr}${dayStr}`;
}

export function generateRandomId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function generatePayload(
  publicJwk: JWK,
  username: string,
  userDob: string
) {
  const sub = `did:key:${generateRandomId()}`;
  const iss = `did:key:${generateRandomId()}`;

  const claim1 = [generateRandomId(), 'name', username]; // Вот это просто base64 строки ["uquby0ERSfSxEq1a0GmXl2Y9w", "name", "denkeni"]
  const claim2 = [generateRandomId(), 'roc_birthday', userDob]; // Вот это просто base64 hash строки ["X1ye49hWK5m2gyaA-tNAtg", "roc_birthday", "0750101"]

  return {
    payload: {
      sub,
      iss,
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      jti: 'https://your-domain.org/credential/uuid',
      nonce: Math.random().toString(36).substring(2, 10),
      cnf: { jwk: { ...publicJwk } },
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', '93581925_dd'],
        credentialStatus: {
          type: 'StatusList2021Entry',
          id: 'https://example.org/status-list/93581925_dd/r0#6',
          statusListIndex: '6',
          statusListCredential:
            'https://example.org/status-list/93581925_dd/r0',
          statusPurpose: 'revocation',
        },
        credentialSchema: {
          id: 'https://example.org/schema/93581925/dd/V1/some-schema-id',
          type: 'JsonSchema',
        },
        credentialSubject: {
          _sd: [
            generateSelectiveDisclosureHash(claim1),
            generateSelectiveDisclosureHash(claim2),
          ],
          _sd_alg: 'sha-256',
        },
      },
    },
    claim1,
    claim2,
  };
}

export async function signJWT(payload: JWTPayload, privateJwk: JWK) {
  const privateKey = await importJWK(privateJwk, 'ES256');

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .sign(privateKey);

  return jwt;
}
