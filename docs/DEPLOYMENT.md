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

Before public directory submission, deploy the matching platform release that
adds `/mcp/authorize` grant issuance and `pmcp_` token verification. The token is
opaque to the MCP server; the platform stores only a SHA-256 hash, expiry,
scopes, and authorization audit metadata.
