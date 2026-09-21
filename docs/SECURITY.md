# Security and product boundary

Promise MCP must call the Promise platform API. It must not access Postgres,
Redis, queues, migrations, provider tokens, or raw provider APIs directly.

MCP v1 should be read-heavy and preserve the Promise safety contract:

- Show what Promise knows and why.
- Draft follow-ups without sending them.
- Deep-link to Promise for confirmation when action is sensitive.
- Use explicit scopes for memory, capture, drafting, and mutation.
- Support revocation and auditability from the Promise account surface.

Do not add `send_email` in v1. Promise's brand promise is that nothing sends
without explicit user review and confirmation.
