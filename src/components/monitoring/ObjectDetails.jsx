import { useEffect, useState } from "react";
import { useObjects } from "../../state/ObjectsContext.jsx";
import { formatRelativeTime } from "../../utils/time.js";
import { TelemetryMetric } from "./TelemetryMetric.jsx";

export function ObjectDetails() {
  const { activeObject } = useObjects();
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const staticRows = activeObject?.static ?? [];

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!activeObject) {
    return (
      <section className="panel side-panel side-panel--details" aria-label="Параметры объекта">
        <div className="object-details">
          <div className="object-details__empty">
            <h2>Параметры объекта</h2>
            <p>Выберите объект слева, чтобы увидеть координаты, телеметрию и дополнительные данные.</p>
          </div>
        </div>
      </section>
    );
  }

  const copyCoordinates = async () => {
    try {
      await navigator.clipboard?.writeText(activeObject.coordinates);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy coordinates", error);
    }
  };

  return (
    <section className="panel side-panel side-panel--details" aria-label="Параметры объекта">
      <div className="object-details">
        <div className="object-details__top">
          <div className="object-details__heading">
            <div>
              <span className="object-details__eyebrow">Параметры объекта</span>
              <h2>{activeObject.name}</h2>
              <p>{activeObject.description}</p>
            </div>
            <span className={`object-details__badge object-details__badge--${activeObject.statusClass}`}>{activeObject.statusText ?? activeObject.status}</span>
          </div>

          <div className="object-details__coordinates">
            <div>
              <span>Координаты</span>
              <strong>{activeObject.coordinates}</strong>
            </div>
            <button
              className={`object-details__copy-button ${copied ? "object-details__copy-button--copied" : ""}`}
              type="button"
              aria-label="Скопировать координаты"
              onClick={copyCoordinates}
            />
          </div>
        </div>

        <div className="object-details__scroll">
          <section className="object-details__section">
            <div className="object-details__section-title">Телеметрия</div>
            <div className="object-details__metrics">
              {activeObject.telemetry.map((item) => (
                <TelemetryMetric key={`${activeObject.id}-${item.key ?? item.label}`} item={item} />
              ))}
            </div>
          </section>

          <section className="object-details__section">
            <div className="object-details__section-title">Статические параметры</div>
            <div className="object-details__pairs">
              {staticRows.map((item) => (
                <div className="object-details__pair" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="object-details__footer">
          <span>Последнее обновление</span>
          <strong>{activeObject.lastUpdate} ({formatRelativeTime(activeObject.updatedAt, now)})</strong>
          <span className={`object-details__footer-dot object-details__footer-dot--${activeObject.statusClass}`} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
