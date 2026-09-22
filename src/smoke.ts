import { handleMcpJsonRpc } from "./mcpProtocol.js";

const initialized = await handleMcpJsonRpc({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {},
}, {});

const tools = await handleMcpJsonRpc({
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {},
}, {});

const authRequired = await handleMcpJsonRpc({
  jsonrpc: "2.0",
  id: 3,
  method: "tools/call",
  params: { name: "get_today", arguments: {} },
}, { clientName: "Smoke test agent", returnUrl: "https://agent.example/callback", state: "smoke" });

console.log(JSON.stringify({ initialized, tools, authRequired }, null, 2));
