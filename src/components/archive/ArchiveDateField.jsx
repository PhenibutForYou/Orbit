import { useMemo, useState } from "react";
import {
  archiveMonthNames,
  archiveWeekdayNames,
  formatArchiveDateValue,
  getValidArchiveTimeValue,
  normalizeArchiveTimeValue,
  parseArchiveDateValue,
} from "./archiveUtils.js";

const timePresets = ["00:00", "08:00", "12:00", "18:00", "23:59"];

export function ArchiveDateField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(parseArchiveDateValue(value.split(" ")[0]) ?? new Date(2025, 4, 23));
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [timeValue, setTimeValue] = useState(value.split(" ")[1] ?? "00:00");
  const selectedValue = formatArchiveDateValue(selectedDate);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: firstDayOffset }, (_, index) => ({ type: "empty", id: `empty-${index}` }));

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({
        type: "day",
        id: formatArchiveDateValue(date),
        label: String(day),
        date,
      });
    }

    return cells;
  }, [viewDate]);

  const apply = () => {
    const validTime = getValidArchiveTimeValue(timeValue) || "00:00";
    onChange(`${formatArchiveDateValue(selectedDate)} ${validTime}`);
    setOpen(false);
  };

  return (
    <div className="archive-field">
      <span>{label}</span>
      <button
        className={`archive-field__control archive-field__control--date ${open ? "is-open" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        {value || "Выберите дату"}
      </button>
      <div className="archive-popover archive-popover--date" hidden={!open}>
        <div className="archive-popover__header">
          <div className="archive-popover__month-row">
            <button
              className="archive-popover__month-nav"
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <strong>{archiveMonthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
            <button
              className="archive-popover__month-nav"
              type="button"
              aria-label="Следующий месяц"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
          <span>Выбор даты и времени</span>
        </div>
        <div className="archive-calendar">
          {archiveWeekdayNames.map((weekday) => (
            <span className="archive-calendar__weekday" key={weekday}>{weekday}</span>
          ))}
          {calendarCells.map((cell) => (
            cell.type === "empty" ? (
              <span className="archive-calendar__empty" key={cell.id} />
            ) : (
              <button
                className={cell.id === selectedValue ? "is-active" : ""}
                key={cell.id}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
              >
                {cell.label}
              </button>
            )
          ))}
        </div>
        <div className="archive-time-picks">
          {timePresets.map((preset) => (
            <button
              className={preset === timeValue ? "is-active" : ""}
              type="button"
              key={preset}
              onClick={() => setTimeValue(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
        <label className="archive-time-custom">
          <span>Свое время</span>
          <input
            className="archive-time-custom__input"
            type="text"
            inputMode="numeric"
            placeholder="ЧЧ:ММ"
            value={timeValue}
            onChange={(event) => setTimeValue(normalizeArchiveTimeValue(event.target.value))}
            onBlur={() => setTimeValue((current) => getValidArchiveTimeValue(current) || current)}
          />
        </label>
        <div className="archive-popover__actions">
          <button type="button" onClick={apply}>Применить</button>
        </div>
      </div>
    </div>
  );
}
