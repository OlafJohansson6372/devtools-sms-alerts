import { z } from "zod";
import { infrai } from "./infrai_sms_client.js";

export const alertRequest = z.object({ to: z.string().min(7), event: z.enum(["build", "release"]), status: z.enum(["failed", "succeeded"]), detail: z.string().min(1).max(240), operation_id: z.string().min(1) });
export type AlertRequest = z.infer<typeof alertRequest>;

export function formatAlert(input: AlertRequest): string {
  const label = input.event === "build" ? "Build" : "Release";
  return `[${label} ${input.status}] ${input.operation_id}: ${input.detail}`;
}

export async function dispatchAlert(raw: unknown) {
  const input = alertRequest.parse(raw);
  return infrai.sms.send({ to: input.to, body: formatAlert(input), idempotency_key: `devtools:${input.operation_id}` });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.ALERT_REQUEST;
  if (!raw) throw new Error("Set ALERT_REQUEST to a JSON request body");
  const result = await dispatchAlert(JSON.parse(raw));
  console.log(`sent message ${result.message_id}`);
}
