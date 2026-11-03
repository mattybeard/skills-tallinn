interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Pokédex pages">
      <button type="button" onClick={() => onPageChange(1)} disabled={page === 1} aria-label="First page">
        «
      </button>
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        ‹ Prev
      </button>
      <span className="page-indicator" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        Next ›
      </button>
      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        aria-label="Last page"
      >
        »
      </button>
    </nav>
  )
}
