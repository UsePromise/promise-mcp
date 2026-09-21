import { promiseTools, unauthenticatedToolResult } from "./toolCatalog.js";

export { PromisePlatformClient } from "./platformClient.js";
export { promiseTools, unauthenticatedToolResult } from "./toolCatalog.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const getTodayTool = promiseTools.find((tool) => tool.name === "get_today");
  if (!getTodayTool) throw new Error("get_today tool is missing");

  console.log(JSON.stringify({
    name: "Promise MCP",
    tools: promiseTools,
    unauthenticatedExample: unauthenticatedToolResult(getTodayTool),
  }, null, 2));
}
