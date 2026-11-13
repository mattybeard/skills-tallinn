import { observer } from 'mobx-react-lite'
import { useService } from '../app/serviceContext'
import styles from './Pagination.module.css'

const PAGE_WINDOW = 5

export const Pagination = observer(function Pagination() {
  const pokedex = useService('pokedex')
  const { page, pageCount } = pokedex

  if (pageCount <= 1) return null

  const windowStart = Math.max(1, Math.min(page - Math.floor(PAGE_WINDOW / 2), pageCount - PAGE_WINDOW + 1))
  const windowEnd = Math.min(pageCount, windowStart + PAGE_WINDOW - 1)
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => windowStart + index)

  const goTo = (target: number): void => {
    pokedex.goToPage(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={`button ${styles.edge}`}
        onClick={() => goTo(1)}
        disabled={page === 1}
        aria-label="First page"
      >
        «
      </button>
      <button type="button" className="button" onClick={() => goTo(page - 1)} disabled={page === 1}>
        Previous
      </button>

      <ol className={styles.pages}>
        {pageNumbers.map((pageNumber) => (
          <li key={pageNumber}>
            <button
              type="button"
              className={`button ${styles.pageButton}`}
              onClick={() => goTo(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
              aria-label={`Page ${pageNumber}`}
            >
              {pageNumber}
            </button>
          </li>
        ))}
      </ol>
      <span className={styles.compact} aria-hidden="true">
        {page} / {pageCount}
      </span>

      <button type="button" className="button" onClick={() => goTo(page + 1)} disabled={page === pageCount}>
        Next
      </button>
      <button
        type="button"
        className={`button ${styles.edge}`}
        onClick={() => goTo(pageCount)}
        disabled={page === pageCount}
        aria-label="Last page"
      >
        »
      </button>
    </nav>
  )
})
