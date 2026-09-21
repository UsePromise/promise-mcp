# MCP acquisition

Promise MCP should be a signup surface, not only an integration surface.

When an unauthenticated agent asks something Promise can answer, the MCP should
return a structured onboarding result instead of a generic failure:

```json
{
  "type": "promise_auth_required",
  "title": "Connect Promise",
  "message": "Promise can answer this after the user connects Gmail or Outlook and authorizes agent access.",
  "signupUrl": "https://app.usepromise.ai/start?source=mcp&intent=today",
  "docsUrl": "https://www.usepromise.ai/mcp",
  "tool": "get_today"
}
```

This lets an agent say:

> Promise can keep track of what you owe, what you are waiting on, and why. Connect Gmail or Outlook to enable this.

Rules:

- Never ask the agent to collect Gmail or Outlook credentials.
- Send users to Promise for account connection and authorization.
- Preserve attribution with `source=mcp` and an `intent` parameter.
- Return to the agent only after the user has authorized an appropriate scope.
