import { useEffect, useState } from "react";
import { historyApi } from "../../api/historyApi.js";
import { ArchiveDateField } from "./ArchiveDateField.jsx";
import { ArchiveSelectField } from "./ArchiveSelectField.jsx";
import { ArchiveSummary } from "./ArchiveSummary.jsx";
import { ArchiveTableClean } from "./ArchiveTableClean.jsx";

const initialFilters = {
  dateFrom: "16.05.2025 00:00",
  dateTo: "23.05.2025 23:59",
  object: "Все объекты",
  status: "Все статусы",
};

const initialHistory = {
  rows: [],
  total: 0,
  summary: [],
  stats: { cards: [] },
  periodLabel: "",
  objectOptions: ["Все объекты"],
  statusOptions: ["Все статусы"],
};

function buildExportFileName(filters) {
  const safeFrom = filters.dateFrom.replace(/[^\d]/g, "").slice(0, 12);
  const safeTo = filters.dateTo.replace(/[^\d]/g, "").slice(0, 12);

  return `history-${safeFrom}-${safeTo}.csv`;
}

export function ArchivePageLive() {
  const [filters, setFilters] = useState(initialFilters);
  const [openSelect, setOpenSelect] = useState(null);
  const [history, setHistory] = useState(initialHistory);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadHistory = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const result = await historyApi.getHistory(nextFilters);
      setHistory(result);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(initialFilters);
  }, []);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setOpenSelect(null);
  };

  const exportCsv = async () => {
    const csv = await historyApi.exportHistoryCsv(filters);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = buildExportFileName(filters);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="archive-layout">
      <section className="archive-stats-grid">
        {history.stats.cards.map((card) => (
          <div className="panel archive-stat-card" key={card.key}>
            <img className="archive-stat-card__icon" src={card.icon} alt="" />
            <div className="archive-stat-card__body">
              <span className="archive-stat-card__label">{card.label}</span>
              <strong className="archive-stat-card__value">{card.value.toLocaleString("ru-RU")}</strong>
              <span className="archive-stat-card__meta">{card.meta}</span>
            </div>
            <span className={`archive-stat-card__spark ${card.spark}`} />
          </div>
        ))}
      </section>

      <section className="panel archive-filters">
        <ArchiveDateField label="Дата с" value={filters.dateFrom} onChange={(value) => updateFilter("dateFrom", value)} />
        <ArchiveDateField label="Дата по" value={filters.dateTo} onChange={(value) => updateFilter("dateTo", value)} />
        <ArchiveSelectField
          label="Объект"
          value={filters.object}
          options={history.objectOptions}
          open={openSelect === "object"}
          onOpen={() => setOpenSelect((current) => (current === "object" ? null : "object"))}
          onChange={(value) => updateFilter("object", value)}
        />
        <ArchiveSelectField
          label="Статус"
          value={filters.status}
          options={history.statusOptions}
          open={openSelect === "status"}
          onOpen={() => setOpenSelect((current) => (current === "status" ? null : "status"))}
          onChange={(value) => updateFilter("status", value)}
        />

        <div className="archive-actions">
          <button className="archive-actions__primary" type="button" disabled={loading} onClick={() => loadHistory()}>
            <img src="/images/search_action.svg" alt="" />
            <span>{loading ? "Загрузка" : "Показать"}</span>
          </button>
          <button className="archive-actions__ghost" type="button" disabled={loading} onClick={exportCsv}>
            <img src="/images/download_action.svg" alt="" />
            <span>Скачать CSV</span>
          </button>
        </div>
      </section>

      <section className="archive-content-grid">
        <ArchiveTableClean
          rows={history.rows}
          totalRows={history.total}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          pageSizeOpen={pageSizeOpen}
          onPageChange={(page) => {
            setCurrentPage(page);
            setPageSizeOpen(false);
          }}
          onRowsPerPageChange={(pageSize) => {
            setRowsPerPage(pageSize);
            setCurrentPage(1);
            setPageSizeOpen(false);
          }}
          onTogglePageSize={() => setPageSizeOpen((current) => !current)}
        />

        <aside className="archive-side-stack">
          <div className="panel archive-side-card archive-side-card--summary">
            <ArchiveSummary summary={history.summary} />
          </div>
          <div className="panel archive-side-card">
            <span>Период выборки</span>
            <strong>{filters.dateFrom} - {filters.dateTo}</strong>
            <p>{history.periodLabel}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
