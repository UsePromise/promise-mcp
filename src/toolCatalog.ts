import { z } from "zod";
import { PROMISE_SITE_URL, signupUrl } from "./config.js";

export const ToolName = z.enum([
  "connect_promise",
  "get_today",
  "list_commitments",
  "get_commitment",
  "get_commitment_evidence",
  "get_person_context",
  "search_memory",
  "capture_note",
  "create_follow_up",
  "mark_resolved",
  "draft_follow_up",
]);

export type ToolName = z.infer<typeof ToolName>;

export type PromiseMcpTool = {
  name: ToolName;
  title: string;
  description: string;
  authRequired: boolean;
  readOnly: boolean;
  signupIntent?: string;
  safety: string;
};

export const promiseTools: PromiseMcpTool[] = [
  {
    name: "connect_promise",
    title: "Connect Promise",
    description:
      "Return a Promise signup URL for users who want agent access to follow-up memory.",
    authRequired: false,
    readOnly: true,
    signupIntent: "connect_for_agents",
    safety: "Never collects provider credentials in the agent. Send the user to Promise.",
  },
  {
    name: "get_today",
    title: "Get Today",
    description: "Return what currently deserves the user's attention.",
    authRequired: true,
    readOnly: true,
    signupIntent: "today",
    safety: "Return concise items and links back to Promise for sensitive action.",
  },
  {
    name: "list_commitments",
    title: "List commitments",
    description: "List what the user owes and what the user is waiting on.",
    authRequired: true,
    readOnly: true,
    signupIntent: "commitments",
    safety: "Do not infer more certainty than Promise returns.",
  },
  {
    name: "get_commitment",
    title: "Get commitment",
    description: "Retrieve a structured Promise commitment or waiting-on item.",
    authRequired: true,
    readOnly: true,
    signupIntent: "commitment_detail",
    safety: "Prefer structured status, due dates, people, and source links over raw mail.",
  },
  {
    name: "get_commitment_evidence",
    title: "Get commitment evidence",
    description: "Show why Promise believes a follow-up or memory exists.",
    authRequired: true,
    readOnly: true,
    signupIntent: "evidence",
    safety: "Return source summaries and citations permitted by the platform API.",
  },
  {
    name: "get_person_context",
    title: "Get person context",
    description: "Summarize what matters before the user speaks with someone.",
    authRequired: true,
    readOnly: true,
    signupIntent: "person_context",
    safety: "Avoid exposing hidden/private fields unless the platform scopes allow them.",
  },
  {
    name: "search_memory",
    title: "Search memory",
    description: "Search Promise's derived memory with user authorization.",
    authRequired: true,
    readOnly: true,
    signupIntent: "search_memory",
    safety: "Search derived Promise memory, not raw provider mailboxes.",
  },
  {
    name: "capture_note",
    title: "Capture note",
    description: "Let a user tell Promise something to remember.",
    authRequired: true,
    readOnly: false,
    signupIntent: "capture",
    safety: "Echo what Promise understood and require review when the platform requests it.",
  },
  {
    name: "create_follow_up",
    title: "Create follow-up",
    description: "Create a future follow-up from explicit user intent.",
    authRequired: true,
    readOnly: false,
    signupIntent: "create_follow_up",
    safety: "Only create follow-ups from explicit user instructions.",
  },
  {
    name: "mark_resolved",
    title: "Mark resolved",
    description: "Tell Promise that a commitment or waiting-on item is complete.",
    authRequired: true,
    readOnly: false,
    signupIntent: "mark_resolved",
    safety: "Confirm destructive or irreversible status changes in the agent UI.",
  },
  {
    name: "draft_follow_up",
    title: "Draft follow-up",
    description: "Draft a follow-up message without sending it.",
    authRequired: true,
    readOnly: false,
    signupIntent: "draft_follow_up",
    safety: "Do not send email in v1. Return a draft and Promise confirmation link.",
  },
];

export function unauthenticatedToolResult(tool: PromiseMcpTool) {
  return {
    type: "promise_auth_required" as const,
    title: "Connect Promise",
    message:
      "Promise can answer this after the user connects Gmail or Outlook and authorizes agent access.",
    signupUrl: signupUrl("mcp", tool.signupIntent ?? tool.name),
    docsUrl: `${PROMISE_SITE_URL}/mcp`,
    tool: tool.name,
  };
}
