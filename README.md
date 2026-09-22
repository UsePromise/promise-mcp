# Promise MCP

Agent-facing MCP server/tools for Promise. The hosted HTTP endpoint is `POST
/mcp`; `GET /healthz` is available for runtime checks.

This repository is intentionally separate from the Promise platform. It should
compose the platform API into agent-friendly tools, not implement canonical
backend business logic.

## Boundary

- Call the Promise platform API for data access and mutations.
- Do not access Postgres, Redis, queues, provider tokens, or migrations directly.
- Keep authorization, provenance, retention, provider behavior, and canonical
  domain rules in the platform.
- Consume explicit platform contracts instead of duplicating procedure or
  capability names by hand.

Initial MCP tool surface:

- `connect_promise`
- `get_today`
- `list_commitments`
- `get_commitment`
- `get_commitment_evidence`
- `get_person_context`
- `search_memory`
- `capture_note`
- `create_follow_up`
- `mark_resolved`
- `draft_follow_up`

`connect_promise` and unauthenticated tool results are intentionally part of
the product. MCP should help users discover and connect Promise when an agent
needs follow-up memory that Promise can provide.

Unauthenticated tool results include a scoped `authorizationUrl` that sends the
user to `https://app.usepromise.ai/start?source=mcp...`, preserves agent
attribution, and uses a relative `/mcp/authorize` callback inside Promise before
any return to an agent URL.

## Development

```bash
npm install
npm run build
npm run smoke
npm run tools
npm run start
```

Example MCP call:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Protected tools return a structured `promise_auth_required` result when no
Bearer token is present. After the user authorizes `/mcp/authorize`, Promise
returns a short-lived one-time code to the agent callback. The agent exchanges
that code at `/api/mcp/token` for a scoped opaque `pmcp_...` bearer token.
Bearer tool calls are proxied to the Promise platform API, which enforces the
grant's scopes. `mark_resolved` and `draft_follow_up` intentionally deep-link
to Promise for user review rather than sending or mutating mail directly.

See `docs/ACQUISITION.md` for signup flow guidance, `docs/SECURITY.md` for the
MCP safety boundary, and `docs/DEPLOYMENT.md` for container/runtime details.
