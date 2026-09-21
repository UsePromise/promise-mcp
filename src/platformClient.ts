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
    const response = await fetch(`${PROMISE_PLATFORM_API_URL}/native/rpc`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${this.accessToken}`,
        "content-type": "application/json",
        ...(this.requestId ? { "x-request-id": this.requestId } : {}),
      },
      body: JSON.stringify({ procedure, input }),
    });

    if (!response.ok) {
      throw new Error(`Promise platform call failed: ${response.status}`);
    }

    return await response.json() as Output;
  }
}
