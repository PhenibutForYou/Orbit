import { useState } from "react";
import { historyApi } from "../../api/historyApi.js";
import {
  ARCHIVE_ALL_OBJECTS_LABEL,
  ARCHIVE_ALL_STATUSES_LABEL,
  ARCHIVE_OBJECT_OPTIONS,
  ARCHIVE_STATUS_OPTIONS,
} from "../../utils/constants.js";
import { ArchiveDateField } from "./ArchiveDateField.jsx";
import { ArchiveSelectField } from "./ArchiveSelectField.jsx";
import { ArchiveSummary } from "./ArchiveSummary.jsx";
import { ArchiveTableClean } from "./ArchiveTableClean.jsx";

const initialFilters = {
  dateFrom: "",
  dateTo: "",
  object: ARCHIVE_ALL_OBJECTS_LABEL,
  status: ARCHIVE_ALL_STATUSES_LABEL,
};

const initialHistory = {
  rows: [],
  total: 0,
  summary: [],
  stats: { cards: [] },
  periodLabel: "",
  objectOptions: ARCHIVE_OBJECT_OPTIONS,
  statusOptions: ARCHIVE_STATUS_OPTIONS,
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
  const [hasSearched, setHasSearched] = useState(false);
  const canSearch = Boolean(filters.dateFrom && filters.dateTo);
  const canExport = hasSearched && history.rows.length > 0;

  const loadHistory = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const result = await historyApi.getHistory(nextFilters);
      setHistory(result);
      setCurrentPage(1);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

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
      <section className="panel archive-filters">
        <ArchiveDateField label="Дата с" value={filters.dateFrom} onChange={(value) => updateFilter("dateFrom", value)} />
        <ArchiveDateField label="Дата по" value={filters.dateTo} onChange={(value) => updateFilter("dateTo", value)} />
        <ArchiveSelectField
          label="Объект"
          value={filters.object}
          options={ARCHIVE_OBJECT_OPTIONS}
          open={openSelect === "object"}
          onOpen={() => setOpenSelect((current) => (current === "object" ? null : "object"))}
          onChange={(value) => updateFilter("object", value)}
        />
        <ArchiveSelectField
          label="Статус"
          value={filters.status}
          options={ARCHIVE_STATUS_OPTIONS}
          open={openSelect === "status"}
          onOpen={() => setOpenSelect((current) => (current === "status" ? null : "status"))}
          onChange={(value) => updateFilter("status", value)}
        />

        <div className="archive-actions">
          <button className="archive-actions__primary" type="button" disabled={loading || !canSearch} onClick={() => loadHistory()}>
            <img src="/images/search_action.svg" alt="" />
            <span>{loading ? "Загрузка" : "Показать"}</span>
          </button>
          <button className="archive-actions__ghost" type="button" disabled={loading || !canExport} onClick={exportCsv}>
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
          emptyMessage={hasSearched ? "Нет записей за выбранный период" : "Выберите период и нажмите «Показать»"}
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
            <strong>{filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : "Период не выбран"}</strong>
            <p>{hasSearched ? history.periodLabel : "Данные появятся после выполнения запроса"}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
