import { buildArchivePaginationItems } from "./archiveUtils.js";

function ArchiveColumns() {
  return (
    <colgroup>
      <col className="archive-table__col archive-table__col--time" />
      <col className="archive-table__col archive-table__col--object" />
      <col className="archive-table__col archive-table__col--coordinates" />
      <col className="archive-table__col archive-table__col--parameter" />
      <col className="archive-table__col archive-table__col--value" />
      <col className="archive-table__col archive-table__col--status" />
    </colgroup>
  );
}

export function ArchiveTableClean({
  rows,
  totalRows,
  currentPage,
  rowsPerPage,
  pageSizeOpen,
  emptyMessage = "Нет записей за выбранный период",
  onPageChange,
  onRowsPerPageChange,
  onTogglePageSize,
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * rowsPerPage;
  const pageRows = rows.slice(pageStartIndex, pageStartIndex + rowsPerPage);
  const visibleFrom = pageRows.length > 0 ? pageStartIndex + 1 : 0;
  const visibleTo = pageStartIndex + pageRows.length;
  const paginationItems = buildArchivePaginationItems(safeCurrentPage, totalPages);

  return (
    <div className="panel archive-table">
      <table className="archive-table__grid archive-table__grid--head">
        <ArchiveColumns />
        <thead>
          <tr>
            <th>Время</th>
            <th>Объект</th>
            <th>Координаты</th>
            <th>Параметр</th>
            <th>Значение</th>
            <th>Статус</th>
          </tr>
        </thead>
      </table>

      <div className="archive-table__scroll">
        <table className="archive-table__grid archive-table__grid--body">
          <ArchiveColumns />
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6}>{emptyMessage}</td>
              </tr>
            ) : pageRows.map((row, index) => (
              <tr key={`${row.time}-${row.object}-${index}`}>
                <td>{row.time}</td>
                <td>
                  <div className="archive-table__object-cell">
                    <img className="archive-table__object-icon" src={row.icon} alt="" />
                    <div className="archive-table__object-meta">
                    <strong>{row.object}</strong>
                    <span className={`archive-table__object-status archive-table__object-status--${row.statusClass}`}>{row.objectStatus}</span>
                    </div>
                  </div>
                </td>
                <td>{row.coordinates}</td>
                <td>{row.parameter}</td>
                <td><strong className="archive-table__value">{row.value}</strong></td>
                <td><span className={`archive-table__badge archive-table__badge--${row.badgeClass ?? row.statusClass}`}>{row.badge}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="archive-table__footer">
        <span>Показано {visibleFrom}-{visibleTo} из {totalRows.toLocaleString("ru-RU")} записей</span>
        <div className="archive-table__pagination">
          <div className="archive-table__pager">
            <button type="button" disabled={safeCurrentPage === 1} onClick={() => onPageChange(safeCurrentPage - 1)}>‹</button>
            {paginationItems.map((item, index) => (
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`}>…</span>
              ) : (
                <button
                  className={item === safeCurrentPage ? "is-active" : ""}
                  type="button"
                  key={item}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              )
            ))}
            <label className="archive-table__page-input">
              <span>Стр.</span>
              <input
                type="text"
                inputMode="numeric"
                value={safeCurrentPage}
                onChange={(event) => {
                  const parsedPage = Number.parseInt(event.target.value.replace(/\D/g, ""), 10);

                  if (Number.isFinite(parsedPage)) {
                    onPageChange(parsedPage);
                  }
                }}
              />
            </label>
            <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => onPageChange(safeCurrentPage + 1)}>›</button>
          </div>
        </div>
        <div className="archive-table__page-size-slot">
          <div className={`archive-table__page-size ${pageSizeOpen ? "is-open" : ""}`}>
            <span>Строк на странице</span>
            <button className="archive-table__page-size-trigger" type="button" onClick={onTogglePageSize}>
              <span>{rowsPerPage}</span>
            </button>
            <div className="archive-table__page-size-menu" hidden={!pageSizeOpen}>
              {[10, 25, 50].map((pageSize) => (
                <button type="button" key={pageSize} onClick={() => onRowsPerPageChange(pageSize)}>{pageSize}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
