import test from "node:test";
import assert from "node:assert/strict";
import { formatAlert, alertRequest } from "./sms_alert_service.js";

test("release failure becomes an actionable SMS", () => {
  const input = alertRequest.parse({ to: "+15551234567", event: "release", status: "failed", detail: "artifact signature check failed", operation_id: "rel-42" });
  assert.equal(formatAlert(input), "[Release failed] rel-42: artifact signature check failed");
});
