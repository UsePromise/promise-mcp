export const PROMISE_SITE_URL =
  process.env.PROMISE_SITE_URL ?? "https://www.usepromise.ai";

export const PROMISE_APP_URL =
  process.env.PROMISE_APP_URL ?? "https://app.usepromise.ai";

export const PROMISE_PLATFORM_API_URL =
  process.env.PROMISE_PLATFORM_API_URL ?? "https://api.usepromise.ai";

export const promiseMcpScopes = [
  "promise.memory.read",
  "promise.evidence.read",
  "promise.capture.write",
  "promise.followup.write",
  "promise.draft.write",
] as const;

export type PromiseMcpScope = typeof promiseMcpScopes[number];

export type PromiseConnectUrlOptions = {
  source?: "mcp";
  intent?: string;
  clientName?: string;
  returnUrl?: string;
  state?: string;
  scopes?: readonly PromiseMcpScope[];
};

export function signupUrl(sourceOrOptions: string | PromiseConnectUrlOptions, intent?: string): string {
  let options: PromiseConnectUrlOptions;
  if (typeof sourceOrOptions === "string") {
    options = {};
    if (sourceOrOptions === "mcp") options.source = "mcp";
    if (intent) options.intent = intent;
  } else {
    options = sourceOrOptions;
  }
  const url = new URL("/start", PROMISE_APP_URL);
  url.searchParams.set("source", options.source ?? "mcp");
  url.searchParams.set("utm_source", "mcp");
  url.searchParams.set("utm_medium", "agent");
  url.searchParams.set("utm_campaign", "agent_discovery");
  if (options.intent) url.searchParams.set("intent", options.intent);
  if (options.clientName) url.searchParams.set("mcpClient", options.clientName);
  if (options.returnUrl) url.searchParams.set("mcpReturnUrl", options.returnUrl);
  if (options.state) url.searchParams.set("mcpState", options.state);
  const scopes = options.scopes?.length ? options.scopes : promiseMcpScopes;
  url.searchParams.set("mcpScopes", scopes.join(" "));
  url.searchParams.set("callbackUrl", mcpAuthorizePath(options));
  return url.toString();
}

export function mcpAuthorizePath(options: PromiseConnectUrlOptions = {}): string {
  const url = new URL("/mcp/authorize", PROMISE_APP_URL);
  url.searchParams.set("source", "mcp");
  if (options.intent) url.searchParams.set("intent", options.intent);
  if (options.clientName) url.searchParams.set("mcpClient", options.clientName);
  if (options.returnUrl) url.searchParams.set("mcpReturnUrl", options.returnUrl);
  if (options.state) url.searchParams.set("mcpState", options.state);
  const scopes = options.scopes?.length ? options.scopes : promiseMcpScopes;
  url.searchParams.set("mcpScopes", scopes.join(" "));
  return `${url.pathname}${url.search}`;
}
