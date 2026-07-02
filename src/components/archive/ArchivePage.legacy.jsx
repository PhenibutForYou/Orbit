import { useEffect, useState } from "react";
export { ArchivePageLive as ArchivePage } from "./ArchivePageLive.jsx";
import { historyApi } from "../../api/historyApi.js";
import { ArchiveDateField } from "./ArchiveDateField.jsx";
import { ArchiveSelectField } from "./ArchiveSelectField.jsx";
import { ArchiveSummary } from "./ArchiveSummary.jsx";
import { ArchiveTable } from "./ArchiveTable.jsx";

const initialFilters = {
  dateFrom: "16.05.2025 00:00",
  dateTo: "23.05.2025 23:59",
  object: "Все объекты",
  status: "Все статусы",
};

export function ArchivePageDeprecated() {
  const [filters, setFilters] = useState(initialFilters);
  const [openSelect, setOpenSelect] = useState(null);
  const [history, setHistory] = useState({ rows: [], total: 0, summary: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const loadHistory = async (nextFilters = filters) => {
    const result = await historyApi.getHistory(nextFilters);
    setHistory(result);
    setCurrentPage(1);
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
    link.download = "history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="archive-layout">
      <section className="archive-stats-grid">
        <div className="panel archive-stat-card">
          <img className="archive-stat-card__icon" src="/images/stat-total.svg" alt="" />
          <div className="archive-stat-card__body">
            <span className="archive-stat-card__label">Всего записей</span>
            <strong className="archive-stat-card__value">128 456</strong>
            <span className="archive-stat-card__meta">за выбранный период</span>
          </div>
          <span className="archive-stat-card__spark archive-stat-card__spark--blue" />
        </div>

        <div className="panel archive-stat-card">
          <img className="archive-stat-card__icon" src="/images/stat-online.svg" alt="" />
          <div className="archive-stat-card__body">
            <span className="archive-stat-card__label">Норма</span>
            <strong className="archive-stat-card__value">96 342</strong>
            <span className="archive-stat-card__meta">75% от всех</span>
          </div>
          <span className="archive-stat-card__spark archive-stat-card__spark--green" />
        </div>

        <div className="panel archive-stat-card">
          <img className="archive-stat-card__icon archive-stat-card__icon--large" src="/images/stat-warning.svg" alt="" />
          <div className="archive-stat-card__body">
            <span className="archive-stat-card__label">Предупреждения</span>
            <strong className="archive-stat-card__value">21 784</strong>
            <span className="archive-stat-card__meta">17% от всех</span>
          </div>
          <span className="archive-stat-card__spark archive-stat-card__spark--amber" />
        </div>

        <div className="panel archive-stat-card">
          <img className="archive-stat-card__icon archive-stat-card__icon--large" src="/images/stat-alert.svg" alt="" />
          <div className="archive-stat-card__body">
            <span className="archive-stat-card__label">Аварии</span>
            <strong className="archive-stat-card__value">8 742</strong>
            <span className="archive-stat-card__meta">7% от всех</span>
          </div>
          <span className="archive-stat-card__spark archive-stat-card__spark--red" />
        </div>
      </section>

      <section className="panel archive-filters">
        <ArchiveDateField label="Дата с" value={filters.dateFrom} onChange={(value) => updateFilter("dateFrom", value)} />
        <ArchiveDateField label="Дата по" value={filters.dateTo} onChange={(value) => updateFilter("dateTo", value)} />
        <ArchiveSelectField
          label="Объект"
          value={filters.object}
          options={["Все объекты", "Генератор-01", "Насосная-02", "Компрессор-01"]}
          open={openSelect === "object"}
          onOpen={() => setOpenSelect((current) => (current === "object" ? null : "object"))}
          onChange={(value) => updateFilter("object", value)}
        />
        <ArchiveSelectField
          label="Статус"
          value={filters.status}
          options={["Все статусы", "Норма", "Предупреждение", "Авария", "Нет данных"]}
          open={openSelect === "status"}
          onOpen={() => setOpenSelect((current) => (current === "status" ? null : "status"))}
          onChange={(value) => updateFilter("status", value)}
        />

        <div className="archive-actions">
          <button className="archive-actions__primary" type="button" onClick={() => loadHistory()}>
            <img src="/images/search_action.svg" alt="" />
            <span>Показать</span>
          </button>
          <button className="archive-actions__ghost" type="button" onClick={exportCsv}>
            <img src="/images/download_action.svg" alt="" />
            <span>Скачать CSV</span>
          </button>
        </div>
      </section>

      <section className="archive-content-grid">
        <ArchiveTable
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
            <strong>{filters.dateFrom} — {filters.dateTo}</strong>
            <p>8 дней 23 часа 59 минут</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
