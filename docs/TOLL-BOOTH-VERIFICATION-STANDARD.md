# Toll-Booth Stranger Verification Standard

This is the canonical analytics policy for every Sterling toll-booth API/MCP service.

## Non-negotiable rule

A core-tool invocation is evidence of tool use. It is **not** automatically evidence of verified stranger use.

Only events classified `CREDIBLE_REAL_USE` may advance a public Stranger #N milestone.

## Required classes

- `CONTROLLED_TEST` — our CI, smoke, demo, benchmark, owner/manual validation, or explicitly internal traffic.
- `KNOWN_VALIDATOR` — known registry, MCP directory, validator, verifier, health service, or machine-evaluation traffic.
- `LIKELY_VALIDATOR` — behavior strongly resembles automated validation but attribution is not definitive.
- `UNKNOWN_MACHINE` — a real core operation occurred but evidence is insufficient to prove genuine independent use.
- `CREDIBLE_REAL_USE` — evidence supports an independent caller using the core capability for a real task.

## Required audit envelope

Candidate core-use events should retain only privacy-safe operational evidence:

- timestamp
- one-way caller fingerprint; never raw IP
- full User-Agent (bounded)
- HTTP method and path; never credentials or sensitive query payloads
- MCP `clientInfo.name` and `clientInfo.version`
- source/channel label
- safe Origin / Referer / Via / forwarded-host metadata when present
- discovery-to-core timing when available
- core tool name or route
- safe target host only when product semantics require it; never full sensitive target URL
- classification and explicit classification reasons
- audit policy version

Never store API keys, Authorization headers, request bodies, raw IP addresses, cookies, or secrets in analytics.

## Controlled-test protocol

Every Sterling-owned production check MUST send both:

- `X-Tollbooth-Internal: 1`
- the service-specific internal header, e.g. `X-Recover-Internal: 1`, `X-Preflight-Internal: 1`, or `X-Once-Internal: 1`

Owned smoke-test User-Agents must also contain `controlled`, `test`, `validator`, or the service-specific test name.

Demo/trial endpoints never count as verified stranger production use.

## Milestone rule

Milestones are permanent only for unique callers whose qualifying event was classified `CREDIBLE_REAL_USE` under the current policy. Historical events that predate the audit envelope default to `UNKNOWN_MACHINE`; they remain in the ledger but cannot occupy a Stranger #N slot.

## Validator rule

Known validator evidence always overrides apparent core use. A registry/directory probe that performs `initialize -> tools/list -> tools/call` is still a validator, not a stranger.

Unknown clients that immediately discover and invoke a tool without stronger evidence should default to `LIKELY_VALIDATOR` or `UNKNOWN_MACHINE`, never `CREDIBLE_REAL_USE` merely because the call succeeded.

## Production acceptance tests

Every new toll booth must prove before distribution that:

1. internal smoke/CI traffic cannot increment verified stranger count;
2. demo/trial traffic cannot increment verified stranger count;
3. known validator traffic cannot increment verified stranger count;
4. an unauditable historical event remains visible as `UNKNOWN_MACHINE`;
5. a credible synthetic fixture can increment exactly one milestone in unit tests only;
6. the production activity endpoint exposes the policy version, candidate classifications, and reasons;
7. no raw IP, body, credentials, or sensitive target URL appears in the audit envelope.

## Factory use

Copy `template/stranger-verification.js` into every future toll-booth repository and configure the core-tool predicate, demo predicate, known validator expressions, and credible-use signals. Do not loosen the default classification merely to make the scoreboard move.
