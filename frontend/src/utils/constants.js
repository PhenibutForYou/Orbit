const readStringFromEnv = (key, fallback) => {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
};

const readNumberFromEnv = (key, fallback) => {
  const value = Number.parseInt(import.meta.env[key], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_CONFIG = {
  baseUrl: trimTrailingSlash(readStringFromEnv("VITE_API_BASE_URL", "")),
  requestTimeoutMs: readNumberFromEnv("VITE_API_REQUEST_TIMEOUT_MS", 10000),
  realtimeTransport: readStringFromEnv("VITE_API_REALTIME_TRANSPORT", "mock"),
  objectsEndpoint: readStringFromEnv("VITE_API_OBJECTS_ENDPOINT", "/api/objects"),
  eventsEndpoint: readStringFromEnv("VITE_API_EVENTS_ENDPOINT", "/api/objects/events"),
  historyEndpoint: readStringFromEnv("VITE_API_HISTORY_ENDPOINT", "/api/history"),
  historyExportEndpoint: readStringFromEnv("VITE_API_HISTORY_EXPORT_ENDPOINT", "/api/history/export"),
};

export const ARCHIVE_ALL_OBJECTS_LABEL = "Все объекты";
export const ARCHIVE_ALL_STATUSES_LABEL = "Все статусы";

export const ARCHIVE_OBJECT_OPTIONS = [
  ARCHIVE_ALL_OBJECTS_LABEL,
  "АЗС",
  "Дрон",
  "Машина",
  "Склад",
];

export const ARCHIVE_STATUS_OPTIONS = [
  ARCHIVE_ALL_STATUSES_LABEL,
  "Норма",
  "Предупреждение",
  "Критические",
  "Нет данных",
];

export const ARCHIVE_OBJECT_TYPE_LABELS = {
  "fuel-station": "АЗС",
  drone: "Дрон",
  car: "Машина",
  warehouse: "Склад",
};

export const ARCHIVE_OBJECT_ICONS = {
  "fuel-station": "/images/azs_icon.svg",
  drone: "/images/drone_icon.svg",
  car: "/images/car_icon.svg",
  warehouse: "/images/warehouse_icon.svg",
};
