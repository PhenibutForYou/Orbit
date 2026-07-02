export const archiveMonthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
export const archiveWeekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function formatArchiveDateValue(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

export function parseArchiveDateValue(value) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!match) {
    return null;
  }

  const parsedDate = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function normalizeArchiveTimeValue(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function getValidArchiveTimeValue(value) {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return "";
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return "";
  }

  return `${match[1]}:${match[2]}`;
}

export function buildArchivePaginationItems(page, totalPages) {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}
