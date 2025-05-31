import { base64url } from 'jose';
import { sha256 } from '@noble/hashes/sha256';
import type { Groth16Proof } from 'snarkjs';

import { generateKeyPairJWK, generatePayload, signJWT } from './jwt_utils';
import { type JwkEcdsaPublicKey, type PemPublicKey } from './es256';
import { generateJwtCircuitParams, generateJwtInputs } from './jwt';
import { JwtProver } from './prover';

export const handleGenerateTestValues = async (
  username: string,
  userDob: string
) => {
  try {
    const { publicJwk, privateJwk } = await generateKeyPairJWK();
    const { payload, claim1, claim2 } = await generatePayload(
      publicJwk,
      username,
      userDob
    );
    const jwt = await signJWT(payload, privateJwk);

    // console.log('publicJwk: ', publicJwk);
    // console.log('privateJwk: ', privateJwk);
    // console.log('payload: ', payload);
    // console.log('jwt: ', jwt);

    const claimsInput = `${JSON.stringify(claim1)}\n${JSON.stringify(claim2)}`;

    return { claimsInput, publicJwk, jwt };
  } catch (err) {
    console.error(err);
    // setStatus('❌ Failed to generate test identity');
  }
};

function generateInputs(
  jwtToken: string,
  jwk: JwkEcdsaPublicKey | PemPublicKey,
  hashedClaims: string[]
) {
  const params = generateJwtCircuitParams([43, 6, 2048, 256, 2000, 5, 50]);
  const inputs = generateJwtInputs(params, jwtToken, jwk, hashedClaims);
  return inputs;
}

export const generateProof = async (
  claimsInput: string,
  jwk: JwkEcdsaPublicKey,
  token: string
) => {
  try {
    const claims = claimsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const hashedClaims = claims.map((e) =>
      base64url.encode(sha256(e)).toString()
    );

    const inputs = generateInputs(token, jwk!, [
      hashedClaims[0], // Вот это просто sha256 hash строки ["uquby0ERSfSxEq1a0GmXl2Y9w", "name", "denkeni"]
      hashedClaims[1], // Вот это просто sha256 hash строки ["X1ye49hWK5m2gyaA-tNAtg", "roc_birthday", "0750101"]
    ]);
    const input = JSON.parse(
      JSON.stringify(
        inputs,
        (_, v) => (typeof v === 'bigint' ? v.toString() : v),
        2
      )
    );
    const { proof, publicSignals } = await JwtProver.generateProof(input);
    console.log('🚀 ~ proof:', proof);
    console.log('🚀 ~ publicSignals:', publicSignals);

    return { proof, publicSignals };
  } catch (err) {
    console.error(err);
  }
};

export const verifyProof = async (proof: Groth16Proof, signals: string[]) => {
  const isValid = await JwtProver.verifyProof(proof, signals);
  console.log('🚀 ~ verifyProof ~ isValid:', isValid);
};
