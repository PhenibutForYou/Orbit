import { useEffect, useState } from "react";
import { useObjects } from "../../state/ObjectsContext.jsx";
import { formatRelativeTime } from "../../utils/time.js";

const statusOrder = {
  alert: 0,
  warning: 1,
  normal: 2,
  nodata: 3,
  online: 2,
  muted: 3,
};

const getObjectTimestamp = (object) => {
  if (object.updatedAt) {
    return new Date(object.updatedAt).getTime();
  }

  const match = object.lastUpdate?.match(/^(\d{2})\s+([а-яА-ЯёЁ]+)\s+(\d{4}),\s+(\d{2}):(\d{2}):(\d{2})/);
  const monthMap = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  };

  if (!match) {
    return 0;
  }

  return new Date(
    Number(match[3]),
    monthMap[match[2].toLowerCase()] ?? 0,
    Number(match[1]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  ).getTime();
};

export function ObjectsPanel() {
  const { objects, activeObjectId, error, setActiveObject } = useObjects();
  const [sortMode, setSortMode] = useState("date");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const sortedObjects = [...objects].sort((firstObject, secondObject) => {
    if (sortMode === "status") {
      const firstStatusOrder = statusOrder[firstObject.status] ?? statusOrder[firstObject.statusClass] ?? 99;
      const secondStatusOrder = statusOrder[secondObject.status] ?? statusOrder[secondObject.statusClass] ?? 99;

      if (firstStatusOrder !== secondStatusOrder) {
        return firstStatusOrder - secondStatusOrder;
      }

      const updatedAtDiff = getObjectTimestamp(secondObject) - getObjectTimestamp(firstObject);

      if (updatedAtDiff !== 0) {
        return updatedAtDiff;
      }

      return firstObject.name.localeCompare(secondObject.name, "ru-RU");
    }

    const updatedAtDiff = getObjectTimestamp(secondObject) - getObjectTimestamp(firstObject);

    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    return firstObject.name.localeCompare(secondObject.name, "ru-RU");
  });

  useEffect(() => {
    if (objects.length === 0 && activeObjectId) {
      setActiveObject(null);
    }
  }, [activeObjectId, objects.length, setActiveObject]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="panel side-panel side-panel--objects">
      <div className="objects-panel__header">
        <h2>Объекты <span>({objects.length})</span></h2>
        <div className="objects-panel__actions">
          <div className="objects-panel__sort">
            <button
              className={`objects-panel__action ${sortMenuOpen ? "objects-panel__action--active" : ""}`}
              type="button"
              aria-label="Сортировка объектов"
              onClick={() => setSortMenuOpen((current) => !current)}
            >
              <img src="/images/filter_icon.svg" alt="" />
            </button>
            <div className="objects-panel__sort-menu" hidden={!sortMenuOpen}>
              <button
                className={sortMode === "date" ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setSortMode("date");
                  setSortMenuOpen(false);
                }}
              >
                По обновлению
              </button>
              <button
                className={sortMode === "status" ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setSortMode("status");
                  setSortMenuOpen(false);
                }}
              >
                По статусу
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="objects-panel__error">
          <strong>Backend недоступен</strong>
          <span>{error}</span>
        </div>
      ) : null}

      <div className={`objects-panel__list ${objects.length > 10 ? "objects-panel__list--scrollable" : ""}`} role="list">
        {sortedObjects.map((object) => {
          const isActive = object.id === activeObjectId;

          return (
            <div
              key={object.id}
              className={[
                "object-item",
                isActive ? "object-item--active" : "",
                object.uiState === "entering" ? "object-item--enter" : "",
                object.uiState === "removing" ? "object-item--removing" : "",
              ].filter(Boolean).join(" ")}
              role="listitem"
              onClick={() => {
                if (!isActive && object.uiState !== "removing") {
                  setActiveObject(object.id, { pulse: true });
                }
              }}
            >
              <img className="object-item__icon" src={object.icon} alt="" />
              <div className="object-item__main">
                <strong>{object.name}</strong>
                <span className={`object-item__status object-item__status--${object.statusClass}`}>{object.statusText ?? object.status}</span>
              </div>
              <div className="object-item__meta">
                <strong>{object.time}</strong>
                <span>{formatRelativeTime(object.updatedAt, now)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
