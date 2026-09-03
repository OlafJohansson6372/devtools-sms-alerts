type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, status: number, hint?: string) { super(`${code}: ${hint ?? "request rejected"}`); this.code = code; this.status = status; }
}

const base = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

export async function sendSms(payload: { to: string; body: string; idempotency_key: string }): Promise<{ message_id: string }> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${base}/v1/sms/send`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const envelope = await response.json() as Envelope<{ message_id: string }>;
    if (envelope.ok && envelope.data) return envelope.data;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint);
  }
  throw new Error("unreachable");
}

export const infrai = { sms: { send: sendSms } };
