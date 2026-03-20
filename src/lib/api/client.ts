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
  auth?: boolean;
  accessToken?: string;
  signal?: AbortSignal;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

const buildUrl = (path: string, params?: RequestOptions["params"]) => {
  const isAbsolute = /^https?:\/\//i.test(path);
  const target = isAbsolute
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const url = isAbsolute ? new URL(target) : new URL(target, "http://dummy");
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return isAbsolute ? url.href : url.href.replace("http://dummy", "");
};

const shouldSendBody = (method: HttpMethod) => !["GET", "HEAD"].includes(method);

// utils/api.ts
export function serializeParams(params?: Record<string, unknown>): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;

  const serialized: Record<string, string | number | boolean> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return; // ignore undefined
    if (value === null) return;      // ignore null, tu peux changer si tu veux garder "null" comme string
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      serialized[key] = value;
    } else {
      // convertit enums ou autres objets en string
      serialized[key] = String(value);
    }
  });

  return serialized;
}


const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
};

export async function apiRequest<TResponse = unknown, TBody = unknown>(
  path: string,
  { method = "GET", params, body, headers, auth = true, accessToken, signal }: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const safeParams = serializeParams(params);
  const url = buildUrl(path, safeParams);
  const finalHeaders = new Headers(headers);
  const requestLog = {
    method,
    url,
    params,
    body: body instanceof FormData ? "[FormData]" : body instanceof Blob ? "[Blob]" : body,
  };

  if (auth) {
    const token = accessToken;
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

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
    console.error("[api] request failed", { ...requestLog, status: response.status }, errorPayload);
    }
    throw new ApiError("API request failed", response.status, errorPayload);
  }

  const rawData = await parseResponse<TResponse>(response);
  const unwrappedData =
    rawData && typeof rawData === "object" && "data" in (rawData as Record<string, unknown>)
      ? (rawData as unknown as { data: TResponse }).data
      : rawData;
  console.info("[api] request succeeded", { ...requestLog, status: response.status }, unwrappedData);
  return unwrappedData;
}

export type Fetcher<T> = (url: string) => Promise<T>;
export const swrFetcher: Fetcher<unknown> = (url: string) => apiRequest(url);
