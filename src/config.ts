export const PROMISE_SITE_URL =
  process.env.PROMISE_SITE_URL ?? "https://www.usepromise.ai";

export const PROMISE_APP_URL =
  process.env.PROMISE_APP_URL ?? "https://app.usepromise.ai";

export const PROMISE_PLATFORM_API_URL =
  process.env.PROMISE_PLATFORM_API_URL ?? "https://api.usepromise.ai";

export function signupUrl(source: string, intent?: string): string {
  const url = new URL("/start", PROMISE_APP_URL);
  url.searchParams.set("source", source);
  if (intent) url.searchParams.set("intent", intent);
  return url.toString();
}
