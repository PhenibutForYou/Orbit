import { getStatusStats } from "../../utils/status.js";

function StatCard({ icon, label, value, meta, tone, trend, largeIcon }) {
  return (
    <div className="panel stat-card">
      <img className={`stat-card__icon ${largeIcon ? "stat-card__icon--large" : ""}`} src={icon} alt="" />
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        <span className={`stat-card__meta ${tone === "blue" ? "stat-card__meta--accent" : ""}`}>{meta}</span>
      </div>
      <div className="stat-card__aside">
        {trend ? (
          <>
            <span className={`stat-card__trend stat-card__trend--${trend.tone}`}>{trend.value}</span>
            <span className="stat-card__subtrend">за сутки</span>
          </>
        ) : null}
        <span className={`stat-card__spark stat-card__spark--${tone}`} />
      </div>
    </div>
  );
}

export function StatsGrid({ objects, maxObjectsCount }) {
  const stats = getStatusStats(objects);

  return (
    <section className="stats-grid">
      <StatCard
        icon="/images/stat-total.svg"
        label="Всего объектов"
        value={stats.total}
        meta={`из ${maxObjectsCount}`}
        tone="blue"
      />
      <StatCard
        icon="/images/stat-online.svg"
        label="Норма"
        value={stats.online}
        meta={`${stats.onlinePercent}% от всех`}
        tone="green"
        trend={{ tone: "green", value: "↑ 16%" }}
      />
      <StatCard
        icon="/images/stat-warning.svg"
        label="Предупреждения"
        value={stats.warning}
        meta={`${stats.warningPercent}% от всех`}
        tone="amber"
        trend={{ tone: "amber", value: "↑ 25%" }}
        largeIcon
      />
      <StatCard
        icon="/images/stat-alert.svg"
        label="Критические"
        value={stats.alert}
        meta={`${stats.alertPercent}% от всех`}
        tone="red"
        trend={{ tone: "red", value: "↑ 100%" }}
        largeIcon
      />
    </section>
  );
}
