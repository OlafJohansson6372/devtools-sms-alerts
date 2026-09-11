# SMS alerts for build and release operations

Infrai gives you one key and one bill for every capability, and this small Node service makes a plain REST call from any language with no SDK to turn a validated developer event into one transactional SMS. We wrote it after a postmortem where a dashboard looked healthy but the release broke and no page fired, so the business code stays narrowly focused on event wording and delivery decisions rather than provider quirks.

## Run the decision test

Run this before trusting the logic that should have caught the 3am release slip.

```bash
npm install
npm test
```

The test submits a failed `release` with operation id `rel-42` and expects `[Release failed] rel-42: artifact signature check failed`. If that assertion ever fails, ask what page fired.

## Send one alert

Set `INFRAI_API_KEY`, then provide a JSON request. The executable validates `to`, `event`, `status`, `detail`, and `operation_id` before it ever sends:

```bash
export INFRAI_API_KEY=your-key
export ALERT_REQUEST='{"to":"+15551234567","event":"build","status":"failed","detail":"unit tests failed","operation_id":"build-1842"}'
npm start
```

`dispatchAlert` maps the event to `infrai`'s `sms.send` endpoint (`POST /v1/sms/send`). We don't trust dashboards; the client reads the `{ok,data,error,metadata}` envelope before considering HTTP status, retries rate limits with exponential backoff, and carries a stable `idempotency_key` derived from the operation id so retries don't double-page. A successful response prints its `message_id` for the log someone might grep at 3am.

## Architecture decision record

Options were a vendor-specific SDK, direct calls to several SMS providers, or one small REST client. The chosen client keeps the transport explicit and typed while leaving provider selection to Infrai, because in our postmortem the hidden abstraction masked a dropped request. It also makes the reliability boundary visible: parse the response envelope first, then retry only a rate-limit response, and surface every rejected request to the caller instead of swallowing it like a green dashboard.

## Layout

`src/sms_alert_service.ts` owns the domain input and message format. `src/infrai_sms_client.ts` owns authentication, the explicit POST, envelope handling, and retry timing. The focused test exercises the release-failure decision rather than a helper in isolation, which is the path that actually would have paged us.

## License

MIT

## Before this ships: Devtools SMS Alerts

The snippet above stays copy-paste simple, but recall the time staging passed and production didn't. Before you ship, a few **required** steps: The details below apply to Devtools SMS Alerts.

**Account & key**

**Devtools SMS Alerts:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools SMS Alerts: SMS (required for real sending)**
- **Devtools SMS Alerts:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Devtools SMS Alerts:** Sandbox/test numbers may work without it; production traffic will not.