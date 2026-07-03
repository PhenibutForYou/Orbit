const readNumberFromEnv = (key, fallback) => {
  const value = Number.parseInt(import.meta.env[key], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const readStringFromEnv = (key, fallback) => {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
};

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const MONITORING_CONFIG = {
  maxObjects: readNumberFromEnv("VITE_MAX_OBJECTS_COUNT", 15),
};

export const MAX_OBJECTS_COUNT = MONITORING_CONFIG.maxObjects;

export const API_CONFIG = {
  baseUrl: trimTrailingSlash(readStringFromEnv("VITE_API_BASE_URL", "")),
  requestTimeoutMs: readNumberFromEnv("VITE_API_REQUEST_TIMEOUT_MS", 10000),
  realtimeTransport: readStringFromEnv("VITE_API_REALTIME_TRANSPORT", "mock"),
  objectsEndpoint: readStringFromEnv("VITE_API_OBJECTS_ENDPOINT", "/api/objects"),
  eventsEndpoint: readStringFromEnv("VITE_API_EVENTS_ENDPOINT", "/api/objects/events"),
  historyEndpoint: readStringFromEnv("VITE_API_HISTORY_ENDPOINT", "/api/history"),
  historyExportEndpoint: readStringFromEnv("VITE_API_HISTORY_EXPORT_ENDPOINT", "/api/history/export"),
};
