export function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "ожидание данных";
  }

  return `${date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}, ${date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export function formatRelativeTime(value, now = Date.now()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "нет данных";
  }

  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (seconds < 3) {
    return "только что";
  }

  if (seconds < 60) {
    return `${seconds} сек назад`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} мин назад`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} ч назад`;
}
