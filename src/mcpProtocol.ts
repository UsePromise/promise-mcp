import { z } from "zod";
import { ToolName } from "./toolCatalog.js";
import { executePromiseTool, mcpToolDefinitions, type ToolExecutionContext } from "./toolHandlers.js";

const requestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.unknown().optional(),
}).strict();

type JsonRpcId = string | number | null;

export async function handleMcpJsonRpc(input: unknown, context: ToolExecutionContext) {
  const request = requestSchema.parse(input);
  const id = request.id ?? null;

  switch (request.method) {
    case "initialize":
      return result(id, {
        protocolVersion: "2025-03-26",
        serverInfo: { name: "Promise MCP", version: "0.1.0" },
        capabilities: { tools: { listChanged: false } },
      });
    case "tools/list":
      return result(id, { tools: mcpToolDefinitions() });
    case "tools/call": {
      const params = z.object({
        name: ToolName,
        arguments: z.unknown().optional(),
      }).strict().parse(request.params);
      const toolResult = await executePromiseTool(params.name, params.arguments ?? {}, context);
      return result(id, toolResult);
    }
    case "notifications/initialized":
      return null;
    default:
      return error(id, -32601, `Unsupported MCP method: ${request.method}`);
  }
}

export function result(id: JsonRpcId, value: unknown) {
  return { jsonrpc: "2.0", id, result: value };
}

export function error(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}
