const Pagination = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        {total} registros &middot; página {page} de {totalPages}
      </span>
      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          &lsaquo; Anterior
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Siguiente &rsaquo;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
