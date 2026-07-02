import { API_CONFIG } from "../utils/constants.js";

export class HttpError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "HttpError";
    this.status = options.status ?? null;
    this.payload = options.payload ?? null;
  }
}

export function buildApiUrl(endpoint, params = null) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_CONFIG.baseUrl}${normalizedEndpoint}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

export async function requestJson(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(buildApiUrl(endpoint, options.params), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(`API request failed: ${response.status}`, {
        status: response.status,
        payload,
      });
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpError("API request timed out");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
