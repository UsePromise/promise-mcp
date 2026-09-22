import superjson from "superjson";
import type { SuperJSONResult } from "superjson";
import { PROMISE_PLATFORM_API_URL } from "./config.js";

export type PlatformClientOptions = {
  accessToken: string;
  requestId?: string;
};

export class PromisePlatformClient {
  private readonly accessToken: string;
  private readonly requestId: string | undefined;

  constructor(options: PlatformClientOptions) {
    this.accessToken = options.accessToken;
    this.requestId = options.requestId;
  }

  async call<Output>(
    procedure: string,
    input: Record<string, unknown>,
  ): Promise<Output> {
    const response = await fetch(`${PROMISE_PLATFORM_API_URL}/api/trpc/${encodeURIComponent(procedure)}`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${this.accessToken}`,
        "content-type": "application/json",
        ...(this.requestId ? { "x-request-id": this.requestId } : {}),
      },
      body: JSON.stringify(superjson.serialize(input)),
    });

    if (!response.ok) {
      throw new Error(`Promise platform call failed: ${response.status}`);
    }

    const envelope = await response.json() as {
      result?: { data?: unknown };
      error?: { message?: string };
    };
    if (envelope.error) {
      throw new Error(envelope.error.message ?? "Promise platform call failed");
    }
    if (!envelope.result || !("data" in envelope.result)) {
      throw new Error("Promise platform call returned an invalid response");
    }
    return superjson.deserialize(envelope.result.data as SuperJSONResult) as Output;
  }
}
