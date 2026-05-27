type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  params?: Record<string, unknown>;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * 🔒 BFF STRICT MODE
 * On force toutes les requêtes à passer par le proxy
 */
const API_BASE_URL = "/api/proxy";

/**
 * 🔒 Interdit toute URL absolue (anti-bypass proxy)
 */
function assertRelativePath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    throw new Error(
      `❌ Absolute URLs are forbidden in apiRequest: ${path}\nUse relative paths with BFF proxy.`
    );
  }
}

/**
 * Construction URL safe
 */
function buildUrl(path: string, params?: Record<string, unknown>) {
  assertRelativePath(path);

  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    "http://dummy"
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.href.replace("http://dummy", "");
}

function shouldSendBody(method: HttpMethod) {
  return !["GET", "HEAD"].includes(method);
}

function serializeParams(params?: Record<string, unknown>) {
  if (!params) return undefined;

  const serialized: Record<string, string | number | boolean> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      serialized[key] = value;
    } else {
      serialized[key] = String(value);
    }
  });

  return serialized;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

function isWrappedResponse<T>(
  data: unknown
): data is { data: T } {
  return (
    typeof data === "object" &&
    data !== null &&
    "data" in data
  );
}

function extractErrorMessage(payload: unknown, fallback = "API request failed"): string {
  if (typeof payload === "string" && payload.length > 0) return payload;
  if (typeof payload === "object" && payload !== null) {
    const p = payload as Record<string, unknown>;
    const msg = p.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(" | ");
    if (Array.isArray(p.errors) && p.errors.length > 0) return (p.errors as unknown[]).join(" | ");
    if (typeof p.error === "string" && p.error.length > 0) return p.error;
    if (typeof p.detail === "string" && p.detail.length > 0) return p.detail;
  }
  return fallback;
}

/**
 * 🚀 CLIENT API BFF
 */
export async function apiRequest<TResponse = unknown, TBody = unknown>(
  path: string,
  { method = "GET", params, body, headers, signal }: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const safeParams = serializeParams(params);
  const url = buildUrl(path, safeParams);

  const finalHeaders = new Headers(headers);

  let finalBody: BodyInit | undefined;

  if (body instanceof FormData || body instanceof Blob) {
    finalBody = body;
  } else if (body !== undefined && body !== null) {
    finalBody = JSON.stringify(body);
    finalHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: shouldSendBody(method) ? finalBody : undefined,
    signal,
    credentials: "include", // 🔥 IMPORTANT pour cookies NextAuth
  });

  if (!response.ok) {
    let errorPayload: unknown;

    try {
      errorPayload = await response.clone().json();
    } catch {
      try {
        errorPayload = await response.text();
      } catch {
        errorPayload = undefined;
      }
    }

    console.error("❌ API ERROR", {
      method,
      url,
      status: response.status,
      errorPayload,
    });

    if (
      response.status === 401 &&
      typeof errorPayload === "object" &&
      errorPayload !== null &&
      (errorPayload as Record<string, unknown>).error === "session_expired"
    ) {
      const { signOut } = await import("next-auth/react");
      signOut({ callbackUrl: "/" });
    }

    const errorMessage = extractErrorMessage(errorPayload);
    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  const rawData = await parseResponse<TResponse>(response);

  // Réponse applicative avec success: false malgré un HTTP 2xx
  if (
    typeof rawData === "object" &&
    rawData !== null &&
    "success" in rawData &&
    (rawData as Record<string, unknown>).success === false
  ) {
    const errorMessage = extractErrorMessage(rawData);
    throw new ApiError(errorMessage, response.status, rawData);
  }

  // Réponse applicative avec success: true — succès quelle que soit la présence de data
  if (
    typeof rawData === "object" &&
    rawData !== null &&
    "success" in rawData &&
    (rawData as Record<string, unknown>).success === true
  ) {
    const d = rawData as Record<string, unknown>;
    return (d.data !== undefined ? d.data : rawData) as TResponse;
  }

  const unwrappedData = isWrappedResponse<TResponse>(rawData)
    ? rawData.data
    : (rawData as TResponse);
  return unwrappedData;
}



/**
 * SWR Fetcher
 */
export const swrFetcher = (url: string) => apiRequest(url);