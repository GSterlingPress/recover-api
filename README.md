# RECOVER

**A failed machine action happened. What should happen next?**

RECOVER is a tiny deterministic decision API for AI agents, MCP clients, automations, and ordinary backend systems. It converts failure context into one of six actions:

`RETRY_NOW` · `WAIT` · `REPAIR_REQUEST` · `VERIFY_FIRST` · `ESCALATE` · `ABORT`

## REST

`POST /v1/recover`

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

Streamable HTTP endpoint: `POST /mcp`

Tool: `recover_decide`

Use RECOVER immediately after a failed API/tool/action and before an automatic retry, especially for side-effecting operations and ambiguous timeouts.

## Analytics

`GET /activity` displays durable, privacy-safe usage telemetry and a permanent **FIRST 10 REAL-WORLD STRANGER CONVERSIONS** scoreboard. Real-use events are stored separately so discovery traffic cannot push milestones out of history. Raw IPs and request payloads are not stored.

## Deploy

The repo is Railway-ready with `Dockerfile` and `railway.toml`. Mount a persistent volume at `/data` so the permanent real-use ledger survives restarts.
