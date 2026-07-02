import { API_CONFIG } from "../utils/constants.js";
import { buildApiUrl, requestJson } from "./httpClient.js";

const statusOptions = ["Все статусы", "Норма", "Предупреждения", "Критические", "Нет данных"];
const statusMeta = {
  normal: {
    label: "Норма",
    tone: "normal",
    color: "#1fda72",
    spark: "archive-stat-card__spark--green",
    icon: "/images/stat-online.svg",
  },
  warning: {
    label: "Предупреждения",
    tone: "warning",
    color: "#ffc72a",
    spark: "archive-stat-card__spark--amber",
    icon: "/images/stat-warning.svg",
  },
  alert: {
    label: "Критические",
    tone: "alert",
    color: "#ff554d",
    spark: "archive-stat-card__spark--red",
    icon: "/images/stat-alert.svg",
  },
  nodata: {
    label: "Нет данных",
    tone: "nodata",
    color: "#95a3b8",
    spark: "archive-stat-card__spark--blue",
    icon: "/images/stat-total.svg",
  },
};

function parseArchiveDateTime(value) {
  const [datePart, timePart = "00:00"] = String(value ?? "").trim().split(" ");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hours = 0, minutes = 0] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildSummary(rows) {
  const counters = {
    normal: 0,
    warning: 0,
    alert: 0,
    nodata: 0,
  };

  for (const row of rows) {
    counters[row.badgeClass] += 1;
  }

  return Object.entries(counters).map(([status, value]) => ({
    ...statusMeta[status],
    status,
    value,
  }));
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
        icon: item.icon,
        spark: item.spark,
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

export const historyApi = {
  async getHistory(filters) {
    const payload = await requestJson(API_CONFIG.historyEndpoint, {
      params: filters,
    });
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    return {
      filters: payload.filters ?? filters,
      rows,
      total: payload.total ?? rows.length,
      summary: payload.summary ?? buildSummary(rows),
      stats: payload.stats ?? buildStats(rows),
      periodLabel: payload.periodLabel ?? buildPeriodLabel(filters),
      objectOptions: payload.objectOptions ?? ["Все объекты"],
      statusOptions: payload.statusOptions ?? statusOptions,
    };
  },

  async exportHistoryCsv(filters) {
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
