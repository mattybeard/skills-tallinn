import { observer } from 'mobx-react-lite'
import { useService } from '../app/serviceContext'
import { PAGE_SIZE } from '../viewmodels/PokedexViewModel'
import { Pagination } from './Pagination'
import { CardSkeleton, PokemonCard } from './PokemonCard'
import styles from './PokedexContent.module.css'

export const PokedexContent = observer(function PokedexContent() {
  const pokedex = useService('pokedex')

  if (pokedex.indexStatus === 'error') {
    return (
      <div className={styles.message} role="alert">
        <h2>Couldn't load the Pokédex</h2>
        <p>Check your connection and try again.</p>
        <button type="button" className="button button-primary" onClick={pokedex.loadIndex}>
          Retry
        </button>
      </div>
    )
  }

  if (pokedex.indexStatus !== 'loaded') {
    return (
      <>
        <p className="visually-hidden" role="status">
          Loading the Pokédex
        </p>
        <ul className={styles.grid}>
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <li key={index}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      </>
    )
  }

  if (pokedex.results.length === 0) {
    return (
      <div className={styles.message} role="status">
        <h2>No Pokémon found</h2>
        <p>Nothing matches "{pokedex.query.trim()}".</p>
        <button type="button" className="button button-primary" onClick={pokedex.clearSearch}>
          Clear search
        </button>
      </div>
    )
  }

  const firstShown = (pokedex.page - 1) * PAGE_SIZE + 1
  const lastShown = firstShown + pokedex.pageItems.length - 1

  return (
    <>
      <p className={styles.summary} role="status">
        {pokedex.isSearching ? 'Search results' : 'Showing'} {firstShown}–{lastShown} of {pokedex.results.length}
      </p>
      <ul className={styles.grid}>
        {pokedex.pageItems.map((summary) => (
          <li key={summary.id}>
            <PokemonCard summary={summary} />
          </li>
        ))}
      </ul>
      <Pagination />
    </>
  )
})
