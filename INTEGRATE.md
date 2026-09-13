# Integrate RECOVER

Choose the safest next action after a failed API, MCP, or agent action instead of blindly retrying.

## 30-second REST test

```bash
curl -s -X POST https://recover-api-production-bbba.up.railway.app/v1/recover \
  -H "content-type: application/json" \
  -d '{"method":"POST","status":503,"attempt":1,"sideEffect":true,"idempotencyKey":false}'
```

## MCP

Remote Streamable HTTP endpoint:

```text
https://recover-api-production-bbba.up.railway.app/mcp
```

Point any MCP client that supports remote Streamable HTTP servers at that URL. The server is designed for machine-to-machine calls and returns conservative decisions rather than inventing certainty.

## Production

- REST base: https://recover-api-production-bbba.up.railway.app
- MCP: https://recover-api-production-bbba.up.railway.app/mcp
- Health: https://recover-api-production-bbba.up.railway.app/health
- Repository: https://github.com/GSterlingPress/recover-api

## Good integration points

Call RECOVER inside retry middleware, agent tool wrappers, workflow engines, job runners, or backend orchestration immediately before the expensive or risky decision it is meant to improve.

Keep the call optional and fail safe: if RECOVER is unreachable, your application should fall back to its existing behavior rather than treat an unavailable advisory service as proof of anything.
