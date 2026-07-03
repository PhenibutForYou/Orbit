import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useObjects } from "../../state/ObjectsContext.jsx";
import { formatDateTime, formatRelativeTime } from "../../utils/time.js";

const tabs = [
  {
    id: "monitoring",
    label: "Мониторинг",
    activeIcon: "/images/nav-monitoring-active.svg",
    inactiveIcon: "/images/nav-monitoring-inactive.svg",
  },
  {
    id: "archive",
    label: "Архив",
    activeIcon: "/images/nav-archive-active.svg",
    inactiveIcon: "/images/nav-archive-inactive.svg",
  },
];

export function TopBar({ activePage, onPageChange }) {
  const { objects, lastEventAt, loading, error } = useObjects();
  const tabsRef = useRef({});
  const shellRef = useRef(null);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [now, setNow] = useState(Date.now());
  const latestUpdate = lastEventAt
    ?? objects.reduce((latest, object) => (
      !latest || new Date(object.updatedAt).getTime() > new Date(latest).getTime() ? object.updatedAt : latest
    ), null);
  const latestUpdateLabel = latestUpdate
    ? `${formatDateTime(latestUpdate)} (${formatRelativeTime(latestUpdate, now)})`
    : "ожидание данных";
  const isWaitingForData = loading || Boolean(error) || !latestUpdate;

  const syncHighlight = () => {
    const activeTab = tabsRef.current[activePage];
    const shell = shellRef.current;

    if (!activeTab || !shell) {
      return;
    }

    const shellPadding = Number.parseFloat(window.getComputedStyle(shell).paddingLeft) || 0;
    setHighlightStyle({
      width: `${activeTab.offsetWidth}px`,
      transform: `translateX(${activeTab.offsetLeft - shellPadding}px)`,
    });
  };

  useLayoutEffect(syncHighlight, [activePage]);

  useEffect(() => {
    window.addEventListener("resize", syncHighlight);
    return () => window.removeEventListener("resize", syncHighlight);
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__logo" aria-hidden="true">
          <img src="/images/logo-signal.svg" alt="" />
        </div>
        <div className="brand__copy">
          <strong>Мониторинг инфраструктуры</strong>
          <span>Система удалённого контроля</span>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Разделы" ref={shellRef}>
        <span className="nav-tabs__highlight" aria-hidden="true" style={highlightStyle} />
        {tabs.map((tab) => {
          const isActive = activePage === tab.id;

          return (
            <a
              key={tab.id}
              ref={(node) => {
                tabsRef.current[tab.id] = node;
              }}
              className={`nav-tabs__item ${isActive ? "nav-tabs__item--active" : ""}`}
              href="#"
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(tab.id);
              }}
            >
              <img className="nav-tabs__icon-image" src={isActive ? tab.activeIcon : tab.inactiveIcon} alt="" />
              <span>{tab.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="status">
        <div className="status__icon" aria-hidden="true">
          <img src="/images/status-refresh.svg" alt="" />
        </div>
        <div className="status__copy">
          <span>Последнее обновление данных</span>
          <strong>{latestUpdateLabel}</strong>
        </div>
        <span className={`status__dot ${isWaitingForData ? "status__dot--waiting" : ""}`} aria-hidden="true" />
      </div>
    </header>
  );
}
