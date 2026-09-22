# Deployment

Promise MCP is a hosted HTTP MCP endpoint backed by the Promise platform API.

## Runtime

Required environment:

- `PORT` — HTTP port, defaults to `3000`.
- `PROMISE_PLATFORM_API_URL` — platform origin, defaults to `https://api.usepromise.ai`.
- `PROMISE_APP_URL` — app origin used for signup/auth handoff, defaults to `https://app.usepromise.ai`.
- `PROMISE_SITE_URL` — public docs origin, defaults to `https://www.usepromise.ai`.

Endpoints:

- `GET /healthz` — health check.
- `POST /mcp` — JSON-RPC MCP endpoint supporting `initialize`, `tools/list`, and `tools/call`.

## Local smoke test

```bash
npm install
npm run build
npm run smoke
npm run start
```

Then call the hosted MCP endpoint:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq
```

Unauthenticated protected tools return a structured `promise_auth_required`
result with a Promise-controlled `authorizationUrl`.

Authorized tools expect the agent to send the token issued by Promise:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer pmcp_...' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_today","arguments":{}}}' | jq
```

## Container

```bash
docker build -t promise-mcp .
docker run --rm -p 3000:3000 \
  -e PROMISE_PLATFORM_API_URL=https://api.usepromise.ai \
  -e PROMISE_APP_URL=https://app.usepromise.ai \
  promise-mcp
```

## Production deployment

Production deploys run from this repository with GitHub Actions:

```bash
gh workflow run "Deploy Azure production" --repo UsePromise/promise-mcp --ref main -f operation=inspect
gh workflow run "Deploy Azure production" --repo UsePromise/promise-mcp --ref main -f operation=deploy
```

The workflow builds and validates the MCP server, pushes a digest-pinned
`promise-mcp` image to the existing Promise Azure Container Registry, then
creates or updates a dedicated Azure Container App named by
`AZURE_MCP_APP_NAME`. It reuses the existing production Container Apps
environment and managed identity from the web Container App, while keeping the
MCP runtime separate from the web/app container.

Required GitHub environment variables for the `production` environment:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_WEB_APP_NAME`
- `AZURE_MCP_APP_NAME`
- `PRODUCTION_API_URL`
- `PROMISE_APP_URL`
- `PROMISE_SITE_URL`

The deploy operation smoke-tests `GET /healthz` and `POST /mcp tools/list`
against the generated Azure Container Apps endpoint.

Production custom domain:

- `https://mcp.usepromise.ai/healthz`
- `https://mcp.usepromise.ai/mcp`

DNS records:

- `CNAME mcp.usepromise.ai` ->
  `promise-prod-mcp.happyground-31cff10e.northeurope.azurecontainerapps.io`
- `TXT asuid.mcp.usepromise.ai` ->
  `AD80362ED818BCAC7B10C698CB3B3096DFCB34FC9F0D82187E4CA220D8C1E9D4`

Before public directory submission, deploy the matching platform release that
adds `/mcp/authorize` grant issuance and `pmcp_` token verification. The token is
opaque to the MCP server; the platform stores only a SHA-256 hash, expiry,
scopes, and authorization audit metadata.
