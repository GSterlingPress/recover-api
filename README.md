# RECOVER

**A failed machine action happened. What should happen next?**

RECOVER is a tiny deterministic decision API for AI agents, MCP clients, automations, and ordinary backend systems. It converts failure context into one of six actions:

`RETRY_NOW` · `WAIT` · `REPAIR_REQUEST` · `VERIFY_FIRST` · `ESCALATE` · `ABORT`

Use it immediately after a failed API/tool/action and before an automatic retry—especially for side-effecting operations, ambiguous timeouts, rate limits, malformed requests, exhausted retry budgets, and uncertain execution outcomes.

## Live production

Base URL: `https://recover-api-production-bbba.up.railway.app`

MCP Streamable HTTP endpoint: `https://recover-api-production-bbba.up.railway.app/mcp`

Activity dashboard: `https://recover-api-production-bbba.up.railway.app/activity`

Safe demo: `https://recover-api-production-bbba.up.railway.app/demo`

## REST

`POST https://recover-api-production-bbba.up.railway.app/v1/recover`

```json
{
  "method":"POST",
  "status":503,
  "error":"upstream timeout",
  "attempt":1,
  "sideEffect":true,
  "idempotencyKey":false
}
```

Example response:

```json
{
  "decision":"VERIFY_FIRST",
  "retry":false,
  "risk":"high",
  "reason":"A side-effecting non-idempotent action may have completed before the failure became visible.",
  "next":"Verify external state or obtain an idempotency key before retrying."
}
```

## MCP

Tool: `recover_decide`

Point an MCP client at:

`https://recover-api-production-bbba.up.railway.app/mcp`

The server is designed for machine discovery and includes `server.json` metadata for the official MCP Registry.

## Why call RECOVER?

Retry libraries answer *how to retry*. RECOVER answers the more important question first: **what is the safest next action after this specific failure?**

Good call sites include API clients, AI agents, browser automations, workflow engines, MCP hosts, job runners, payment/order flows, and any system where blindly retrying can duplicate a side effect or amplify a failure.

## Analytics

`GET /activity` displays durable, privacy-safe usage telemetry and a permanent **FIRST 10 REAL-WORLD STRANGER CONVERSIONS** scoreboard. Real-use events are stored separately so discovery traffic cannot push milestones out of history. Raw IPs and request payloads are not stored.

## Deploy

The repo is Railway-ready with `Dockerfile` and `railway.toml`. Mount a persistent volume at `/data` so the permanent real-use ledger survives restarts.
