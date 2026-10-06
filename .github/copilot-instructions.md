# Promise MCP always-on instructions

Optimize this repository for a one-human company: minimize permanent complexity, prefer deletion/consolidation, and challenge new dependencies, services, state, scheduled work, and overlapping tools.

Promise MCP is a client over the Promise platform API. Do not add direct access to Postgres, Redis, queues, migrations, provider tokens, or Gmail/Outlook APIs. Do not duplicate canonical authorization, provenance, retention, or domain rules locally.

Keep the tool surface small and composable. New tools must have distinct user/agent jobs and clear authorization semantics. Consequential actions remain reviewable; do not silently turn captures, follow-ups, or drafts into message sending/provider mutation.

Use the organization-level Promise agents/skills for deeper architecture, complexity, privacy, scale, product-scope, and change-review reasoning when relevant, but obey these invariants even when no specialist is explicitly selected.
