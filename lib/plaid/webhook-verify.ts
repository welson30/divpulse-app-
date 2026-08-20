import "server-only";
import { createHash, createPublicKey, timingSafeEqual, verify as cryptoVerify } from "node:crypto";
import { getPlaidClient } from "@/lib/plaid/client";

/**
 * Verifies the Plaid-Verification header on an incoming webhook.
 *
 * This is the authentication boundary for an endpoint that can mark a
 * user's broker connection dead and trigger notifications — same reasoning
 * as the Stripe webhook verifying its signature before trusting any
 * payload (app/api/webhooks/stripe/route.ts). Without it the route would
 * accept any POST claiming to be Plaid.
 *
 * Plaid signs with an ES256 JWT whose payload carries a SHA-256 of the
 * request body, so both the sender and the body are authenticated:
 *
 *   1. Read `kid` from the JWT header, require alg === "ES256".
 *   2. Fetch the matching public key (JWK) from Plaid, cached by kid.
 *   3. Verify the JWT signature against that key.
 *   4. Constant-time compare SHA-256(rawBody) with the request_body_sha256
 *      claim — this is what stops a replay of a valid header against a
 *      different body.
 *   5. Reject anything whose `iat` is older than five minutes.
 *
 * Implemented on node:crypto rather than pulling in a JWT library:
 * ES256's JWS signature is the raw r||s pair, which is exactly Node's
 * "ieee-p1363" DSA encoding, and createPublicKey reads a JWK directly.
 * Keeps the dependency footprint where lib/crypto/encryption.ts already
 * put it.
 */

const MAX_AGE_SECONDS = 5 * 60;

// Plaid rotates these keys, and a single webhook burst can reference the
// same kid many times. Cached for the lifetime of the server instance;
// an unknown kid always triggers a fresh fetch, so rotation self-heals.
const keyCache = new Map<string, ReturnType<typeof createPublicKey>>();

type JwtHeader = { alg?: string; kid?: string };
type JwtPayload = { iat?: number; request_body_sha256?: string };

function decodeSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function getVerificationKey(keyId: string) {
  const cached = keyCache.get(keyId);
  if (cached) return cached;

  const { data } = await getPlaidClient().webhookVerificationKeyGet({ key_id: keyId });
  const jwk = data.key;

  // Only the fields that define the EC public key — Plaid's JWK also
  // carries use/alg/created_at/expired_at, which createPublicKey rejects
  // or ignores depending on the Node version.
  const publicKey = createPublicKey({
    key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
    format: "jwk",
  });

  keyCache.set(keyId, publicKey);
  return publicKey;
}

export type WebhookVerification = { valid: true } | { valid: false; reason: string };

export async function verifyPlaidWebhook(rawBody: string, verificationHeader: string | null): Promise<WebhookVerification> {
  if (!verificationHeader) {
    return { valid: false, reason: "Missing Plaid-Verification header" };
  }

  const parts = verificationHeader.split(".");
  if (parts.length !== 3) {
    return { valid: false, reason: "Malformed verification JWT" };
  }
  const [headerSegment, payloadSegment, signatureSegment] = parts as [string, string, string];

  const header = decodeSegment<JwtHeader>(headerSegment);
  // Pinning the algorithm is what prevents the classic JWT downgrade,
  // where an attacker re-signs with "none" or a symmetric alg.
  if (header?.alg !== "ES256" || !header.kid) {
    return { valid: false, reason: "Unexpected JWT algorithm or missing key id" };
  }

  let publicKey;
  try {
    publicKey = await getVerificationKey(header.kid);
  } catch {
    return { valid: false, reason: "Could not retrieve Plaid verification key" };
  }

  const signatureValid = cryptoVerify(
    "sha256",
    Buffer.from(`${headerSegment}.${payloadSegment}`),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    Buffer.from(signatureSegment, "base64url"),
  );
  if (!signatureValid) {
    return { valid: false, reason: "JWT signature does not verify" };
  }

  const payload = decodeSegment<JwtPayload>(payloadSegment);
  if (!payload?.request_body_sha256 || typeof payload.iat !== "number") {
    return { valid: false, reason: "Verification JWT missing required claims" };
  }

  // Freshness check happens before the body compare purely so a stale but
  // otherwise valid webhook reports the more useful reason.
  if (Math.floor(Date.now() / 1000) - payload.iat > MAX_AGE_SECONDS) {
    return { valid: false, reason: "Verification JWT is too old" };
  }

  const actual = Buffer.from(createHash("sha256").update(rawBody, "utf8").digest("hex"), "utf8");
  const expected = Buffer.from(payload.request_body_sha256, "utf8");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { valid: false, reason: "Request body hash mismatch" };
  }

  return { valid: true };
}
