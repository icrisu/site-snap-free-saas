import { createHmac, timingSafeEqual } from "crypto";

const MAX_TIMESTAMP_AGE_SECONDS = 300; // 5 minutes

export function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  // Paddle-Signature format: ts=TIMESTAMP;h1=HASH
  const parts = signature.split(";");
  const tsStr = parts.find((p) => p.startsWith("ts="))?.slice(3);
  const h1 = parts.find((p) => p.startsWith("h1="))?.slice(3);

  if (!tsStr || !h1) return false;

  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) return false;

  // Check timestamp freshness
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_TIMESTAMP_AGE_SECONDS) return false;

  // Compute expected signature
  const payload = `${tsStr}:${rawBody}`;
  const expected = createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  // Constant-time comparison
  try {
    return timingSafeEqual(Buffer.from(h1), Buffer.from(expected));
  } catch {
    return false;
  }
}
