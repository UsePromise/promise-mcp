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

`server.json` is the canonical metadata published to the official MCP Registry.
`server.draft.json` is retained as the editable source copy.

Published listing:

- Name: `ai.usepromise/promise`
- Version: `0.1.0`
- Status: active
- Published: 2026-09-22
- Remote: `https://mcp.usepromise.ai/mcp`

## Publishing commands

To update the listing after metadata changes:

```bash
mcp-publisher validate server.json
mcp-publisher publish server.json
```

Publishing uses domain authentication for `usepromise.ai`, which permits the
reverse-DNS registry name `ai.usepromise/promise`. Keep the private signing key
out of the repository.
