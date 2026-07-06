const variantConfig = {
  blue: {
    accent: "#2da2ff",
    track: "rgba(45, 162, 255, 0.16)",
  },
  green: {
    accent: "#2bdc7a",
    track: "rgba(43, 220, 122, 0.16)",
  },
  amber: {
    accent: "#ffc341",
    track: "rgba(255, 195, 65, 0.16)",
  },
  red: {
    accent: "#ff5c54",
    track: "rgba(255, 92, 84, 0.16)",
  },
};

function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function MetricStatusDonut({ percentage, variant }) {
  const { accent, track } = variantConfig[variant] ?? variantConfig.blue;
  const normalizedPercentage = clampPercentage(percentage);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - (normalizedPercentage / 100));

  return (
    <div className="metric-status-card__donut-block">
      <div className={`metric-status-donut metric-status-donut--${variant}`}>
        <svg className="metric-status-donut__svg" viewBox="0 0 72 72" aria-hidden="true">
          <circle
            className="metric-status-donut__track"
            cx="36"
            cy="36"
            r={radius}
            stroke={track}
            strokeWidth="8"
            fill="none"
          />
          <circle
            className="metric-status-donut__progress"
            cx="36"
            cy="36"
            r={radius}
            stroke={accent}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="metric-status-donut__center">
          <strong>{normalizedPercentage}%</strong>
        </div>
      </div>
    </div>
  );
}

export function MetricStatusCard({
  title,
  value,
  percentage,
  progressLabel,
  icon,
  variant = "blue",
  active = false,
}) {
  return (
    <article
      className={[
        "panel",
        "metric-status-card",
        `metric-status-card--${variant}`,
        active ? "metric-status-card--active" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="metric-status-card__content">
        <div className="metric-status-card__copy">
          <img className="metric-status-card__icon" src={icon} alt="" />
          <div className="metric-status-card__text">
            <span className="metric-status-card__title">{title}</span>
            <strong className="metric-status-card__value">{value}</strong>
            <span className="metric-status-card__progress-label">{progressLabel}</span>
          </div>
        </div>
        <MetricStatusDonut
          percentage={percentage}
          variant={variant}
        />
      </div>
    </article>
  );
}
