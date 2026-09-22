# MCP acquisition

Promise MCP should be a signup surface, not only an integration surface.

When an unauthenticated agent asks something Promise can answer, the MCP should
return a structured onboarding result instead of a generic failure:

```json
{
  "type": "promise_auth_required",
  "title": "Connect Promise",
  "message": "Promise can answer this after the user connects Gmail or Outlook and authorizes agent access.",
  "signupUrl": "https://app.usepromise.ai/start?source=mcp&intent=today&mcpClient=Claude&mcpReturnUrl=https%3A%2F%2Fclaude.ai%2Fcallback&mcpState=opaque-state&mcpScopes=promise.memory.read+promise.evidence.read&callbackUrl=%2Fmcp%2Fauthorize%3Fsource%3Dmcp%26intent%3Dtoday%26mcpClient%3DClaude%26mcpReturnUrl%3Dhttps%253A%252F%252Fclaude.ai%252Fcallback%26mcpState%3Dopaque-state%26mcpScopes%3Dpromise.memory.read%2Bpromise.evidence.read",
  "authorizationUrl": "https://app.usepromise.ai/start?source=mcp&intent=today&mcpClient=Claude&mcpReturnUrl=https%3A%2F%2Fclaude.ai%2Fcallback&mcpState=opaque-state&mcpScopes=promise.memory.read+promise.evidence.read&callbackUrl=%2Fmcp%2Fauthorize%3Fsource%3Dmcp%26intent%3Dtoday%26mcpClient%3DClaude%26mcpReturnUrl%3Dhttps%253A%252F%252Fclaude.ai%252Fcallback%26mcpState%3Dopaque-state%26mcpScopes%3Dpromise.memory.read%2Bpromise.evidence.read",
  "docsUrl": "https://www.usepromise.ai/mcp",
  "tool": "get_today",
  "intent": "today",
  "requiredScopes": ["promise.memory.read", "promise.evidence.read"],
  "returnMode": "agent_handoff"
}
```

This lets an agent say:

> Promise can keep track of what you owe, what you are waiting on, and why. Connect Gmail or Outlook to enable this.

Rules:

- Never ask the agent to collect Gmail or Outlook credentials.
- Send users to Promise for account connection and authorization.
- Preserve attribution with `source=mcp` and an `intent` parameter.
- Include UTM attribution: `utm_source=mcp`, `utm_medium=agent`, and
  `utm_campaign=agent_discovery`.
- Carry agent return state only as handoff context. The app must keep OAuth
  callbacks relative and route users through `/mcp/authorize` before returning
  to an agent URL.
- Return to the agent only after the user has authorized an appropriate scope.
