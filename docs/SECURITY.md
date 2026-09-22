# Security and product boundary

Promise MCP must call the Promise platform API. It must not access Postgres,
Redis, queues, migrations, provider tokens, or raw provider APIs directly.

MCP v1 should be read-heavy and preserve the Promise safety contract:

- Show what Promise knows and why.
- Draft follow-ups without sending them.
- Deep-link to Promise for confirmation when action is sensitive.
- Use explicit scopes for memory, capture, drafting, and mutation.
- Return only short-lived one-time authorization codes from `/mcp/authorize`.
  Agents must exchange a code at `/api/mcp/token` before receiving a scoped
  opaque `pmcp_` bearer token.
- Store token and authorization-code hashes only; keep expiry, scopes, and
  grant audit metadata in the platform.
- Support revocation from the Promise account surface and revocation API.
- Keep agent return URLs out of provider OAuth callbacks. OAuth should return
  to Promise first, then Promise can validate scopes and return to the agent.

Do not add `send_email` in v1. Promise's brand promise is that nothing sends
without explicit user review and confirmation.
