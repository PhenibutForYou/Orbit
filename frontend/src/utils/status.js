export const statusLabels = {
  normal: "Норма",
  warning: "Предупреждение",
  alert: "Критическое",
  nodata: "Нет данных",
  online: "Норма",
  muted: "Нет данных",
};

export function getStatusLabel(status) {
  return statusLabels[status] ?? statusLabels.nodata;
}

export function getTelemetryTone(statusOrProgress) {
  if (statusOrProgress === "normal") {
    return "ok";
  }

  if (statusOrProgress === "warning" || statusOrProgress === "alert" || statusOrProgress === "nodata") {
    return statusOrProgress;
  }

  const progress = Number(statusOrProgress);

  if (progress < 20) {
    return "alert";
  }

  if (progress < 45) {
    return "warning";
  }

  return "ok";
}

export function getStatusStats(objects) {
  const total = objects.length;
  const normal = objects.filter((item) => item.status === "normal" || item.statusClass === "online").length;
  const warning = objects.filter((item) => item.status === "warning" || item.statusClass === "warning").length;
  const alert = objects.filter((item) => item.status === "alert" || item.statusClass === "alert").length;

  const getPercent = (value) => (total === 0 ? 0 : Math.round((value / total) * 100));

  return {
    total,
    online: normal,
    normal,
    warning,
    alert,
    onlinePercent: getPercent(normal),
    normalPercent: getPercent(normal),
    warningPercent: getPercent(warning),
    alertPercent: getPercent(alert),
  };
}
