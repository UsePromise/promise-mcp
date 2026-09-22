# Distribution checklist

Promise MCP is deployed and smoke-tested at:

- MCP endpoint: `https://mcp.usepromise.ai/mcp`
- Health check: `https://mcp.usepromise.ai/healthz`
- Azure fallback endpoint: `https://promise-prod-mcp.happyground-31cff10e.northeurope.azurecontainerapps.io/mcp`

Public discovery surfaces verified on 2026-09-22:

- `https://www.usepromise.ai/agents`
- `https://www.usepromise.ai/mcp`
- `https://www.usepromise.ai/llms.txt`
- `https://www.usepromise.ai/sitemap.xml`
- `https://www.usepromise.ai/robots.txt`

## Registry submission status

`server.draft.json` contains the intended official MCP Registry metadata for
the remote server. Do not publish it yet.

Remaining blockers before public registry/directory submission:

1. Prove the `ai.usepromise` registry namespace through the official registry
   flow, either with a DNS TXT record or `/.well-known/mcp-registry-auth`.
2. Decide whether `UsePromise/promise-mcp` should be public before submission.
   The registry metadata references the GitHub repository.
3. Re-run production smoke checks before publishing:
   `GET /healthz`, `POST /mcp initialize`, `tools/list`, unauthenticated
   `promise_auth_required`, and an authorized `pmcp_` tool call.

## Submission commands

After the blockers are resolved:

```bash
mcp-publisher auth
cp server.draft.json server.json
mcp-publisher publish
```

Keep `server.draft.json` until the canonical endpoint is stable. If the registry
requires GitHub namespace publishing instead of domain namespace publishing, use
the `mcp-publisher init` output as the source of truth and preserve the same
description, remote endpoint, safety contract, and authorization flow.
