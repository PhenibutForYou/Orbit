import { API_CONFIG, ARCHIVE_OBJECT_OPTIONS, ARCHIVE_STATUS_OPTIONS } from "../utils/constants.js";
import { buildArchiveSummary, getArchiveStatusMeta, normalizeArchiveRows } from "../utils/archiveHistory.js";
import { buildApiUrl, requestJson } from "./httpClient.js";
import { devHistoryBackend } from "./devHistoryBackend.js";

function parseArchiveDateTime(value) {
  const [datePart, timePart = "00:00"] = String(value ?? "").trim().split(" ");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hours = 0, minutes = 0] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildSummary(rows) {
  return buildArchiveSummary(rows);
}

function buildStats(rows) {
  const summary = buildSummary(rows);
  const total = rows.length;
  const percent = (value) => (total === 0 ? 0 : Math.round((value / total) * 100));

  return {
    total,
    cards: [
      {
        key: "total",
        label: "Всего записей",
        value: total,
        meta: "за выбранный период",
        icon: "/images/stat-total.svg",
        spark: "archive-stat-card__spark--blue",
      },
      ...summary.slice(0, 3).map((item) => ({
        key: item.status,
        label: item.label,
        value: item.value,
        meta: `${percent(item.value)}% от всех`,
        icon: getArchiveStatusMeta(item.status).icon,
        spark: getArchiveStatusMeta(item.status).spark,
      })),
    ],
  };
}

function buildPeriodLabel(filters = {}) {
  const from = parseArchiveDateTime(filters.dateFrom);
  const to = parseArchiveDateTime(filters.dateTo);

  if (!from || !to || to < from) {
    return "Период не выбран";
  }

  const diffMs = to.getTime() - from.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${days} дн. ${hours} ч. ${minutes} мин.`;
}

function buildHistoryResponse(payload, filters) {
  const rows = normalizeArchiveRows(payload?.rows);

  return {
    filters,
    rows,
    total: rows.length,
    summary: buildSummary(rows),
    stats: buildStats(rows),
    periodLabel: buildPeriodLabel(filters),
    objectOptions: ARCHIVE_OBJECT_OPTIONS,
    statusOptions: ARCHIVE_STATUS_OPTIONS,
  };
}

export const historyApi = {
  async getHistory(filters) {
    if (API_CONFIG.realtimeTransport === "mock") {
      const payload = await devHistoryBackend.getHistory(filters);
      return buildHistoryResponse(payload, filters);
    }

    const payload = await requestJson(API_CONFIG.historyEndpoint, {
      params: filters,
    });

    return buildHistoryResponse(payload, filters);
  },

  async exportHistoryCsv(filters) {
    if (API_CONFIG.realtimeTransport === "mock") {
      return devHistoryBackend.exportHistoryCsv(filters);
    }

    const response = await fetch(buildApiUrl(API_CONFIG.historyExportEndpoint, filters), {
      headers: {
        Accept: "text/csv",
      },
    });

    if (!response.ok) {
      throw new Error(`History export failed: ${response.status}`);
    }

    return response.text();
  },
};
