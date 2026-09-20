import "server-only";

import type { CrmApiError } from "./types";

export class CrmError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 0,
    public readonly requestId?: string,
  ) {
    super(`CRM request failed (${code})`);
    this.name = "CrmError";
  }
}

function getConfig() {
  const base = process.env.OBRIYM_API_URL?.trim();
  const token = process.env.OBRIYM_API_TOKEN?.trim();
  if (!base || !token) throw new CrmError("NOT_CONFIGURED");

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new CrmError("INVALID_API_URL");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.hostname === "crm.example.com" ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new CrmError("INVALID_API_URL");
  }
  url.pathname = `${url.pathname.replace(/\/$/, "").replace(/\/api\/v1$/, "")}/api/v1/`;
  return { url, token };
}

/** Server-only GET requests. Cache public catalog data in the calling function. */
export async function crmGet<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const { url: base, token } = getConfig();
  if (!/^[a-z][a-z0-9_/-]*$/i.test(path) || path.includes("//")) {
    throw new CrmError("INVALID_API_PATH");
  }
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CrmError("CONNECTION_FAILED");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CrmError("INVALID_RESPONSE", response.status);
  }
  if (!response.ok) {
    const envelope = body as { error?: Partial<CrmApiError> } | null;
    const error = envelope?.error;
    throw new CrmError(
      `HTTP_${response.status}`,
      response.status,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    );
  }
  return body as T;
}

export async function crmPost<T>(path: string, payload: unknown): Promise<T> {
  const { url: base, token } = getConfig();
  if (!/^[a-z][a-z0-9_/-]*$/i.test(path) || path.includes("//")) {
    throw new CrmError("INVALID_API_PATH");
  }

  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new CrmError("CONNECTION_FAILED");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CrmError("INVALID_RESPONSE", response.status);
  }
  if (!response.ok) {
    const error = (body as { error?: Partial<CrmApiError> } | null)?.error;
    throw new CrmError(
      `HTTP_${response.status}`,
      response.status,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    );
  }
  return body as T;
}
