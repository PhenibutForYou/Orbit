export function ArchiveSummary({ summary }) {
  const total = summary.reduce((sum, item) => sum + item.value, 0);
  let progressOffset = 0;
  const gradientStops = total === 0
    ? "rgba(93, 116, 150, 0.36) 0% 100%"
    : summary
    .map((item) => {
      const ratio = item.value / total;
      const start = progressOffset * 100;
      progressOffset += ratio;
      const end = progressOffset * 100;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="archive-summary">
      <span>Сводка за период</span>
      <div className="archive-summary__layout">
        <div className="archive-summary__chart" style={{ background: `conic-gradient(${gradientStops})` }}>
          <div className="archive-summary__center">
            <div>
              <strong>{total.toLocaleString("ru-RU")}</strong>
              <span>всего</span>
            </div>
          </div>
        </div>
        <div className="archive-summary__legend">
          {summary.map((item) => {
            const percent = total === 0 ? 0 : Math.round((item.value / total) * 100);

            return (
              <div className="archive-summary__item" key={item.label}>
                <span className={`archive-summary__dot archive-summary__dot--${item.tone}`} />
                <span>{item.label}</span>
                <strong className="archive-summary__value">{item.value.toLocaleString("ru-RU")} ({percent}%)</strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
