import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  PROMISE_APP_URL,
  promiseMcpScopes,
  type PromiseConnectUrlOptions,
  type PromiseMcpScope,
  signupUrl,
} from "./config.js";
import { PromisePlatformClient } from "./platformClient.js";
import { type PromiseMcpTool, promiseTools, type ToolName, unauthenticatedToolResult } from "./toolCatalog.js";

export type ToolExecutionContext = {
  accessToken?: string;
  requestId?: string;
  clientName?: string;
  returnUrl?: string;
  state?: string;
};

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: unknown;
  isError?: boolean;
};

const connectSchema = z.object({
  clientName: z.string().trim().min(1).max(80).optional(),
  returnUrl: z.string().url().optional(),
  state: z.string().trim().min(1).max(256).optional(),
  intent: z.string().trim().min(1).max(64).optional(),
  scopes: z.array(z.enum(promiseMcpScopes)).optional(),
}).strict();

const getTodaySchema = z.object({
  horizonDays: z.number().int().min(0).max(30).default(7),
}).strict().optional();

const listCommitmentsSchema = z.object({
  category: z.enum(["all", "waitingOnMe", "waitingOnThem", "dueSoon", "overdue"]).default("all"),
  scope: z.enum(["active", "snoozed", "history"]).default("active"),
  limit: z.number().int().min(1).max(50).default(25),
}).strict().optional();

const idSchema = z.object({ id: z.string().uuid() }).strict();

const personContextSchema = z.object({
  contactId: z.string().uuid().optional(),
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(10).default(5),
}).strict();

const searchMemorySchema = z.object({
  query: z.string().trim().min(1).max(160),
  limit: z.number().int().min(1).max(20).default(10),
}).strict();

const captureNoteSchema = z.object({
  transcript: z.string().trim().min(1).max(4000),
  title: z.string().trim().min(1).max(500).optional(),
  kind: z.enum(["task", "follow_up", "remember"]).default("remember"),
  personName: z.string().trim().min(1).max(200).nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  requestId: z.string().uuid().optional(),
}).strict();

const createFollowUpSchema = z.object({
  title: z.string().trim().min(1).max(500),
  transcript: z.string().trim().min(1).max(4000).optional(),
  personName: z.string().trim().min(1).max(200).nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  requestId: z.string().uuid().optional(),
}).strict();

const draftFollowUpSchema = z.object({
  commitmentId: z.string().uuid().optional(),
  personName: z.string().trim().min(1).max(200).optional(),
  context: z.string().trim().min(1).max(4000).optional(),
  goal: z.string().trim().min(1).max(500).optional(),
}).strict();

export const toolInputSchemas: Record<ToolName, Record<string, unknown>> = {
  connect_promise: objectSchema({
    clientName: { type: "string", description: "Name of the agent or MCP client requesting access." },
    returnUrl: { type: "string", description: "HTTPS URL the user can return to after Promise authorization." },
    state: { type: "string", description: "Opaque agent state returned unchanged after authorization." },
    intent: { type: "string", description: "Signup intent to preserve in Promise attribution." },
    scopes: { type: "array", items: { type: "string", enum: [...promiseMcpScopes] } },
  }),
  get_today: objectSchema({
    horizonDays: { type: "integer", minimum: 0, maximum: 30, default: 7 },
  }),
  list_commitments: objectSchema({
    category: { type: "string", enum: ["all", "waitingOnMe", "waitingOnThem", "dueSoon", "overdue"], default: "all" },
    scope: { type: "string", enum: ["active", "snoozed", "history"], default: "active" },
    limit: { type: "integer", minimum: 1, maximum: 50, default: 25 },
  }),
  get_commitment: objectSchema({ id: { type: "string", format: "uuid" } }, ["id"]),
  get_commitment_evidence: objectSchema({ id: { type: "string", format: "uuid" } }, ["id"]),
  get_person_context: objectSchema({
    contactId: { type: "string", format: "uuid" },
    query: { type: "string", description: "Name or email search when contactId is unknown." },
    limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
  }),
  search_memory: objectSchema({
    query: { type: "string" },
    limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
  }, ["query"]),
  capture_note: objectSchema({
    transcript: { type: "string" },
    title: { type: "string" },
    kind: { type: "string", enum: ["task", "follow_up", "remember"], default: "remember" },
    personName: { type: "string" },
    contactId: { type: "string", format: "uuid" },
    dueAt: { type: "string", format: "date-time" },
    requestId: { type: "string", format: "uuid" },
  }, ["transcript"]),
  create_follow_up: objectSchema({
    title: { type: "string" },
    transcript: { type: "string" },
    personName: { type: "string" },
    contactId: { type: "string", format: "uuid" },
    dueAt: { type: "string", format: "date-time" },
    requestId: { type: "string", format: "uuid" },
  }, ["title"]),
  mark_resolved: objectSchema({ id: { type: "string", format: "uuid" } }, ["id"]),
  draft_follow_up: objectSchema({
    commitmentId: { type: "string", format: "uuid" },
    personName: { type: "string" },
    context: { type: "string" },
    goal: { type: "string" },
  }),
};

export async function executePromiseTool(
  name: ToolName,
  args: unknown,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  const tool = toolByName(name);
  if (!tool) return toolError({ type: "promise_tool_not_found", tool: name });

  if (name === "connect_promise") {
    const input = connectSchema.parse(args ?? {});
    const options = connectUrlOptions(input, context, tool);
    const url = signupUrl(options);
    return toolSuccess({
      type: "promise_connect",
      authorizationUrl: url,
      signupUrl: url,
      requiredScopes: options.scopes,
      returnMode: "agent_handoff",
    });
  }

  if (tool.authRequired && !context.accessToken) {
    const options: Omit<PromiseConnectUrlOptions, "intent" | "scopes"> = {};
    if (context.clientName) options.clientName = context.clientName;
    if (context.returnUrl) options.returnUrl = context.returnUrl;
    if (context.state) options.state = context.state;
    return toolSuccess(unauthenticatedToolResult(tool, options));
  }

  const clientOptions = { accessToken: context.accessToken! };
  const client = new PromisePlatformClient(context.requestId
    ? { ...clientOptions, requestId: context.requestId }
    : clientOptions);

  switch (name) {
    case "get_today": {
      const input = getTodaySchema.parse(args ?? {});
      const [captures, dueSoon, overdue] = await Promise.all([
        client.call("capture.dailySynthesis", {}),
        client.call("commitments.list", { category: "dueSoon", scope: "active", limit: 10 }),
        client.call("commitments.list", { category: "overdue", scope: "active", limit: 10 }),
      ]);
      return toolSuccess({
        type: "promise_today",
        horizonDays: input?.horizonDays ?? 7,
        captures,
        dueSoon,
        overdue,
      });
    }
    case "list_commitments": {
      const input = listCommitmentsSchema.parse(args ?? {});
      return toolSuccess(await client.call("commitments.list", {
        category: input?.category ?? "all",
        scope: input?.scope ?? "active",
        limit: input?.limit ?? 25,
      }));
    }
    case "get_commitment":
    case "get_commitment_evidence": {
      const input = idSchema.parse(args);
      return toolSuccess(await client.call("commitments.getDetail", input));
    }
    case "get_person_context": {
      const input = personContextSchema.parse(args ?? {});
      if (input.contactId) {
        return toolSuccess(await client.call("people.getDetail", { contactId: input.contactId }));
      }
      if (!input.query) {
        throw new Error("Provide contactId or query.");
      }
      return toolSuccess(await client.call("people.list", {
        search: input.query,
        limit: input.limit,
        includeDetails: false,
      }));
    }
    case "search_memory": {
      const input = searchMemorySchema.parse(args);
      const [people, commitments] = await Promise.all([
        client.call("people.list", { search: input.query, limit: input.limit, includeDetails: false }),
        client.call("commitments.list", { category: "all", scope: "active", limit: input.limit }),
      ]);
      return toolSuccess({ type: "promise_memory_search", query: input.query, people, commitments });
    }
    case "capture_note": {
      const input = captureNoteSchema.parse(args);
      return toolSuccess(await client.call("capture.create", {
        requestId: input.requestId ?? randomUUID(),
        kind: input.kind,
        title: input.title ?? input.transcript.slice(0, 500),
        transcript: input.transcript,
        personName: input.personName ?? null,
        contactId: input.contactId ?? null,
        dueAt: input.dueAt ?? null,
      }));
    }
    case "create_follow_up": {
      const input = createFollowUpSchema.parse(args);
      return toolSuccess(await client.call("capture.create", {
        requestId: input.requestId ?? randomUUID(),
        kind: "follow_up",
        title: input.title,
        transcript: input.transcript ?? input.title,
        personName: input.personName ?? null,
        contactId: input.contactId ?? null,
        dueAt: input.dueAt ?? null,
      }));
    }
    case "mark_resolved": {
      const input = idSchema.parse(args);
      return toolSuccess({
        type: "promise_action_required",
        message: "Promise needs the user to confirm resolution in the app until MCP grant/audit support exposes this mutation safely.",
        commitmentId: input.id,
        confirmationUrl: `${PROMISE_APP_URL}/dashboard/promises/${encodeURIComponent(input.id)}`,
      });
    }
    case "draft_follow_up": {
      const input = draftFollowUpSchema.parse(args ?? {});
      return toolSuccess({
        type: "promise_draft_review_required",
        message: "MCP v1 does not send email. Draft review stays in Promise until hosted grants and draft persistence are enabled.",
        input,
        reviewUrl: `${PROMISE_APP_URL}/dashboard`,
      });
    }
  }
}

export function mcpToolDefinitions() {
  return promiseTools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: `${tool.description} Safety: ${tool.safety}`,
    inputSchema: toolInputSchemas[tool.name],
    annotations: {
      readOnlyHint: tool.readOnly,
      destructiveHint: false,
      idempotentHint: tool.readOnly || tool.name === "connect_promise",
      openWorldHint: false,
    },
  }));
}

function connectUrlOptions(
  input: z.infer<typeof connectSchema>,
  context: ToolExecutionContext,
  tool: PromiseMcpTool,
): PromiseConnectUrlOptions {
  const options: PromiseConnectUrlOptions = {
    source: "mcp",
    intent: input.intent ?? tool.signupIntent ?? tool.name,
    scopes: input.scopes ?? tool.scopes as readonly PromiseMcpScope[],
  };
  const clientName = input.clientName ?? context.clientName;
  const returnUrl = input.returnUrl ?? context.returnUrl;
  const state = input.state ?? context.state;
  if (clientName) options.clientName = clientName;
  if (returnUrl) options.returnUrl = returnUrl;
  if (state) options.state = state;
  return options;
}

function toolByName(name: ToolName) {
  return promiseTools.find((tool) => tool.name === name);
}

function toolSuccess(structuredContent: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

function toolError(structuredContent: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: true,
  };
}

function objectSchema(properties: Record<string, unknown>, required: string[] = []) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}
