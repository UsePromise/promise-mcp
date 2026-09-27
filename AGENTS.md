# Promise MCP agent guide

This repository owns the agent-facing MCP client surface for Promise. It composes the Promise platform API into safe, discoverable tools; it does not own canonical Promise business logic or storage.

Promise-wide agent, skill, governance, and one-human-company conventions are defined in `UsePromise/.github/OPERATING-SYSTEM.md`. This file remains authoritative for MCP-local implementation rules.

## One-human-company invariants

Promise is intentionally optimized to remain operable by one human for as long as practical. Every material change should minimize permanent operational and conceptual complexity, prefer deletion/consolidation over addition, and avoid new services, state stores, dependencies, scheduled jobs, settings, or concepts unless they remove more complexity than they create.

The organization-level agents and skills in `UsePromise/.github` provide deeper procedures for architecture, complexity, deletion, scale, privacy, claims, product scope, and change review. The critical rules below are local so they apply even when no specialist is explicitly invoked.

## Boundaries

- Call the Promise platform API for all canonical data access and mutations.
- Never access Postgres, Redis, queues, provider tokens, migrations, or provider APIs directly.
- Keep authorization, provenance, retention, provider behavior, and canonical domain rules in `UsePromise/platform`.
- Consume explicit platform contracts instead of duplicating procedure/capability names by hand.
- Treat MCP as a client boundary: tools may compose platform operations but must not become a parallel backend.
- Keep consequential actions reviewable. Do not turn follow-up creation, memory capture, or draft generation into autonomous sending or provider mutation.
- Prefer a smaller tool surface with clear semantics over many overlapping tools.

## Working rules

- Start with `README.md`, `docs/SECURITY.md`, `docs/ACQUISITION.md`, and `docs/DEPLOYMENT.md`.
- Preserve the unauthenticated discovery/connect flow and scoped authorization model.
- Treat bearer scope and platform authorization as authoritative; do not infer broader access locally.
- New tools must justify why an existing tool cannot express the job cleanly.
- New dependencies and runtime infrastructure must justify their permanent operating cost.

## Validation

Use the smallest relevant command from `package.json`; for broad changes run build plus smoke/tools validation. Governance CI enforces architectural boundaries and requires explicit rationale for structural changes.
