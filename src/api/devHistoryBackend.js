import {
  ARCHIVE_OBJECT_TYPE_LABELS,
  ARCHIVE_ALL_OBJECTS_LABEL,
  ARCHIVE_ALL_STATUSES_LABEL,
} from "../utils/constants.js";
import { normalizeArchiveStatus } from "../utils/archiveHistory.js";

const objectCatalog = [
  {
    name: "АЗС-01",
    type: "fuel-station",
    coordinates: "14.22850, -22.67140",
    parameters: [
      { label: "Запас топлива", unit: "%", base: 74, delta: 11, threshold: { warningBelow: 45, alertBelow: 20 } },
      { label: "Нагрузка насосов", unit: "%", base: 43, delta: 18, threshold: { warningAbove: 65, alertAbove: 85 } },
      { label: "Очередь", unit: " ед.", base: 3, delta: 3, threshold: { warningAbove: 5, alertAbove: 8 } },
    ],
  },
  {
    name: "Грузовик-02",
    type: "car",
    coordinates: "-41.50320, 18.19430",
    parameters: [
      { label: "Топливо", unit: "%", base: 62, delta: 14, threshold: { warningBelow: 40, alertBelow: 18 } },
      { label: "Скорость", unit: " км/ч", base: 57, delta: 19, threshold: {} },
      { label: "Температура двигателя", unit: " °C", base: 91, delta: 13, threshold: { warningAbove: 103, alertAbove: 114 } },
    ],
  },
  {
    name: "Дрон-03",
    type: "drone",
    coordinates: "39.11740, 56.98120",
    parameters: [
      { label: "Батарея", unit: "%", base: 79, delta: 15, threshold: { warningBelow: 45, alertBelow: 22 } },
      { label: "Высота", unit: " м", base: 128, delta: 35, threshold: {} },
      { label: "Сигнал", unit: "%", base: 88, delta: 9, threshold: { warningBelow: 52, alertBelow: 28 } },
    ],
  },
  {
    name: "Склад-04",
    type: "warehouse",
    coordinates: "-8.67010, -37.24560",
    parameters: [
      { label: "Заполненность", unit: "%", base: 58, delta: 17, threshold: { warningAbove: 68, alertAbove: 86 } },
      { label: "Температура", unit: " °C", base: 17, delta: 9, threshold: { warningAbove: 27, alertAbove: 33 } },
      { label: "Влажность", unit: "%", base: 45, delta: 18, threshold: { warningAbove: 68, alertAbove: 84 } },
    ],
  },
];

const mockDelay = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseArchiveDateTime(value) {
  const [datePart, timePart = "00:00"] = String(value ?? "").trim().split(" ");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hours = 0, minutes = 0] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getStatusClass(parameter, rawValue) {
  const threshold = parameter.threshold ?? {};

  if (Number.isFinite(threshold.alertBelow) && rawValue <= threshold.alertBelow) {
    return "alert";
  }

  if (Number.isFinite(threshold.warningBelow) && rawValue <= threshold.warningBelow) {
    return "warning";
  }

  if (Number.isFinite(threshold.alertAbove) && rawValue >= threshold.alertAbove) {
    return "alert";
  }

  if (Number.isFinite(threshold.warningAbove) && rawValue >= threshold.warningAbove) {
    return "warning";
  }

  return "normal";
}

function buildValue(base, delta, tick) {
  const rawValue = base + Math.round(Math.sin(tick / 3.2) * delta) + (((tick * 11) % 7) - 3);
  return Math.max(0, rawValue);
}

function buildRows() {
  const rows = [];
  const startDate = new Date(2025, 4, 10, 6, 0, 0, 0);
  const totalGroups = 64;

  for (let tick = 0; tick < totalGroups; tick += 1) {
    const object = objectCatalog[tick % objectCatalog.length];
    const eventDate = new Date(startDate.getTime() + (tick * 3 * 60 * 60 * 1000));
    const parameterEntries = object.parameters.map((parameter, parameterIndex) => {
      const valueSeed = tick + (parameterIndex * 2);
      const rawValue = buildValue(parameter.base, parameter.delta, valueSeed);
      const statusClass = getStatusClass(parameter, rawValue);

      return {
        parameter: parameter.label,
        value: `${rawValue}${parameter.unit}`,
        statusClass,
      };
    });
    parameterEntries.forEach((entry, index) => {
      const rowDate = new Date(eventDate.getTime() + (index * 17 * 60 * 1000));

      rows.push({
        time: formatDateTime(rowDate),
        timestamp: rowDate.toISOString(),
        object: object.name,
        type: object.type,
        coordinates: object.coordinates,
        parameter: entry.parameter,
        value: entry.value,
        status: entry.statusClass,
      });
    });
  }

  return rows.sort((firstRow, secondRow) => (
    new Date(secondRow.timestamp).getTime() - new Date(firstRow.timestamp).getTime()
  ));
}

const sourceRows = buildRows();

function filterRows(filters = {}) {
  const from = parseArchiveDateTime(filters.dateFrom);
  const to = parseArchiveDateTime(filters.dateTo);

  return sourceRows.filter((row) => {
    const rowDate = new Date(row.timestamp);

    if (from && rowDate < from) {
      return false;
    }

    if (to && rowDate > to) {
      return false;
    }

    if (filters.object && filters.object !== ARCHIVE_ALL_OBJECTS_LABEL) {
      const objectTypeLabel = ARCHIVE_OBJECT_TYPE_LABELS[row.type] ?? row.object;

      if (objectTypeLabel !== filters.object) {
        return false;
      }
    }

    if (filters.status && filters.status !== ARCHIVE_ALL_STATUSES_LABEL) {
      if (row.status !== normalizeArchiveStatus(filters.status)) {
        return false;
      }
    }

    return true;
  });
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "");

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
}

export const devHistoryBackend = {
  async getHistory(filters = {}) {
    await mockDelay(240);

    const rows = filterRows(filters).map(({ timestamp, ...row }) => row);

    return {
      rows,
    };
  },

  async exportHistoryCsv(filters = {}) {
    await mockDelay(180);

    const rows = filterRows(filters);
    const headers = [
      "time",
      "object",
      "type",
      "coordinates",
      "parameter",
      "value",
      "status",
    ];
    const csvRows = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));

    return [headers.join(","), ...csvRows].join("\n");
  },
};
