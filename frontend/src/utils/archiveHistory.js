import { ARCHIVE_OBJECT_ICONS } from "./constants.js";

const DEFAULT_ARCHIVE_ICON = "/images/warehouse_icon.svg";

const archiveStatusMeta = {
  normal: {
    code: "normal",
    label: "Норма",
    tone: "normal",
    color: "#1fda72",
    spark: "archive-stat-card__spark--green",
    icon: "/images/stat-online.svg",
  },
  warning: {
    code: "warning",
    label: "Предупреждение",
    tone: "warning",
    color: "#ffc72a",
    spark: "archive-stat-card__spark--amber",
    icon: "/images/stat-warning.svg",
  },
  alert: {
    code: "alert",
    label: "Критическое",
    tone: "alert",
    color: "#ff554d",
    spark: "archive-stat-card__spark--red",
    icon: "/images/stat-alert.svg",
  },
  nodata: {
    code: "nodata",
    label: "Нет данных",
    tone: "nodata",
    color: "#95a3b8",
    spark: "archive-stat-card__spark--blue",
    icon: "/images/stat-total.svg",
  },
};

const archiveStatusAliases = {
  normal: "normal",
  online: "normal",
  warning: "warning",
  alert: "alert",
  critical: "alert",
  nodata: "nodata",
  muted: "nodata",
  "Норма": "normal",
  "Предупреждение": "warning",
  "Предупреждения": "warning",
  "Критическое": "alert",
  "Критические": "alert",
  "Нет данных": "nodata",
};

export function normalizeArchiveStatus(status) {
  return archiveStatusAliases[String(status ?? "").trim()] ?? "nodata";
}

export function getArchiveStatusMeta(status) {
  return archiveStatusMeta[normalizeArchiveStatus(status)] ?? archiveStatusMeta.nodata;
}

export function getArchiveObjectIcon(type) {
  return ARCHIVE_OBJECT_ICONS[type] ?? DEFAULT_ARCHIVE_ICON;
}

export function normalizeArchiveRow(row = {}) {
  return {
    time: String(row.time ?? ""),
    object: String(row.object ?? ""),
    type: String(row.type ?? "warehouse"),
    coordinates: String(row.coordinates ?? ""),
    parameter: String(row.parameter ?? ""),
    value: String(row.value ?? ""),
    status: normalizeArchiveStatus(row.status),
  };
}

export function normalizeArchiveRows(rows) {
  return Array.isArray(rows) ? rows.map(normalizeArchiveRow) : [];
}

export function buildArchiveSummary(rows) {
  const counters = {
    normal: 0,
    warning: 0,
    alert: 0,
    nodata: 0,
  };

  for (const row of rows) {
    counters[normalizeArchiveStatus(row.status)] += 1;
  }

  return Object.entries(counters).map(([status, value]) => ({
    ...getArchiveStatusMeta(status),
    status,
    value,
  }));
}
