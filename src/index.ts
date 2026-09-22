import { promiseMcpScopes } from "./config.js";
import { promiseTools, unauthenticatedToolResult } from "./toolCatalog.js";

export { PromisePlatformClient } from "./platformClient.js";
export {
  mcpAuthorizePath,
  promiseMcpScopes,
  signupUrl,
  type PromiseConnectUrlOptions,
  type PromiseMcpScope,
} from "./config.js";
export { promiseTools, unauthenticatedToolResult } from "./toolCatalog.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const getTodayTool = promiseTools.find((tool) => tool.name === "get_today");
  if (!getTodayTool) throw new Error("get_today tool is missing");

  console.log(JSON.stringify({
    name: "Promise MCP",
    scopes: promiseMcpScopes,
    tools: promiseTools,
    unauthenticatedExample: unauthenticatedToolResult(getTodayTool, {
      clientName: "Example agent",
      returnUrl: "https://agent.example/callback",
      state: "opaque-agent-state",
    }),
  }, null, 2));
}
