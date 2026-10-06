---
applyTo: "src/**,server*.json"
---

# MCP tool and boundary rules

When changing MCP tools, transport, auth, or server metadata:

- Treat `UsePromise/platform` as the only canonical business-logic/data boundary.
- Do not add direct Postgres, Redis, queue, provider-token, migration, Gmail, or Outlook access.
- Reuse platform authorization/scopes; do not broaden access in the MCP layer.
- Keep consequential actions reviewable and explicit; do not silently send mail or mutate provider state.
- Before adding a tool, prove that an existing tool cannot express the agent job cleanly. Prefer composition over tool proliferation.
- Keep provenance/evidence available when the platform provides it.
- Avoid storing durable Promise domain state in MCP.
- For new tool names/capabilities, document client/platform impact and validate server metadata/tool listings together.
