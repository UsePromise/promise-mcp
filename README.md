# Promise MCP

Agent-facing MCP server/tools for Promise.

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

Potential MCP tools include:

- `find_promises(person, status)`
- `get_relationship_context(person)`
- `record_follow_up(person, when, note)`
- `search_memory(query, scope)`
