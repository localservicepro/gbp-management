// Links between steps carry the GHL contact id plus an HMAC so nobody can
// pull up another contact's agreement by guessing an id.
import { createHmac, timingSafeEqual, createHash } from "node:crypto";

function secret(): string {
  const s = process.env.APP_SECRET || process.env.GHL_PIT_TOKEN;
  if (!s) throw new Error("APP_SECRET or GHL_PIT_TOKEN must be set");
  return createHash("sha256").update(s).digest("hex");
}

export function signContact(contactId: string): string {
  return createHmac("sha256", secret()).update(contactId).digest("base64url").slice(0, 32);
}

export function verifyContact(contactId: string | null | undefined, token: string | null | undefined): boolean {
  if (!contactId || !token) return false;
  const expected = Buffer.from(signContact(contactId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function stepUrl(path: string, contactId: string): string {
  const q = new URLSearchParams({ c: contactId, t: signContact(contactId) });
  return `${path}?${q.toString()}`;
}
