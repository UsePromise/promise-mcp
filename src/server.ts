import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { error, handleMcpJsonRpc } from "./mcpProtocol.js";

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const MAX_BODY_BYTES = 1_000_000;

export function startServer(port = PORT) {
  const server = createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unexpected MCP server error";
      writeJson(res, 500, error(null, -32603, message));
    }
  });
  server.listen(port, () => {
    console.log(`Promise MCP listening on :${port}`);
  });
  return server;
}

async function route(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    writeEmpty(res, 204);
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/healthz")) {
    writeJson(res, 200, {
      name: "Promise MCP",
      status: "ok",
      endpoints: { mcp: "/mcp", health: "/healthz" },
    });
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/mcp") {
    writeJson(res, 404, { error: "Not found" });
    return;
  }

  const body = await readJson(req);
  const context = {
    requestId: header(req.headers["x-request-id"]) ?? randomUUID(),
  };
  const accessToken = bearerToken(req.headers.authorization);
  const clientName = header(req.headers["x-promise-mcp-client"]);
  const returnUrl = header(req.headers["x-promise-mcp-return-url"]);
  const state = header(req.headers["x-promise-mcp-state"]);
  const response = await handleMcpJsonRpc(body, {
    ...context,
    ...(accessToken ? { accessToken } : {}),
    ...(clientName ? { clientName } : {}),
    ...(returnUrl ? { returnUrl } : {}),
    ...(state ? { state } : {}),
  });

  if (response === null) {
    writeEmpty(res, 202);
  } else {
    writeJson(res, 200, response);
  }
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(new Error("MCP request body is too large"));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function bearerToken(value: string | undefined) {
  const match = /^Bearer\s+(.+)$/i.exec(value ?? "");
  return match?.[1]?.trim();
}

function header(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function writeJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "access-control-allow-headers": "authorization, content-type, x-request-id, x-promise-mcp-client, x-promise-mcp-return-url, x-promise-mcp-state",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

function writeEmpty(res: ServerResponse, status: number) {
  res.writeHead(status, {
    "access-control-allow-headers": "authorization, content-type, x-request-id, x-promise-mcp-client, x-promise-mcp-return-url, x-promise-mcp-state",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": "*",
  });
  res.end();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
