import { getStatusStats } from "../../utils/status.js";
import { MetricStatusCard } from "./MetricStatusCard.jsx";

export function StatusMetricsGrid({ objects, maxObjectsCount }) {
  const stats = getStatusStats(objects);
  const capacityPercentage = maxObjectsCount === 0
    ? 0
    : Math.round((stats.total / maxObjectsCount) * 100);

  return (
    <section className="stats-grid">
      <MetricStatusCard
        icon="/images/stat-total.svg"
        title="Всего объектов"
        value={stats.total}
        subtitle={`из ${maxObjectsCount}`}
        percentage={capacityPercentage}
        progressLabel="от вместимости"
        variant="blue"
        active
      />
      <MetricStatusCard
        icon="/images/stat-online.svg"
        title="Норма"
        value={stats.online}
        subtitle={`${stats.onlinePercent}% от всех`}
        percentage={stats.onlinePercent}
        progressLabel="стабильные"
        variant="green"
      />
      <MetricStatusCard
        icon="/images/stat-warning.svg"
        title="Предупреждения"
        value={stats.warning}
        subtitle={`${stats.warningPercent}% от всех`}
        percentage={stats.warningPercent}
        progressLabel="требуют внимания"
        variant="amber"
      />
      <MetricStatusCard
        icon="/images/stat-alert.svg"
        title="Критические"
        value={stats.alert}
        subtitle={`${stats.alertPercent}% от всех`}
        percentage={stats.alertPercent}
        progressLabel="срочные"
        variant="red"
      />
    </section>
  );
}
