import { observer } from 'mobx-react-lite'
import { useService } from '../app/serviceContext'
import type { PokemonSummary } from '../services/PokeApiService'
import { formatPokedexNumber } from '../services/pokemonNames'
import { PokemonArtwork } from './PokemonArtwork'
import { TypeBadgeList } from './TypeBadge'
import styles from './PokemonCard.module.css'

export const PokemonCard = observer(function PokemonCard({ summary }: { summary: PokemonSummary }) {
  const pokedex = useService('pokedex')
  const card = pokedex.cards.get(summary.id)
  const number = formatPokedexNumber(summary.id)

  if (card?.status === 'loaded') {
    const { pokemon } = card
    return (
      <button
        type="button"
        className={styles.card}
        data-type={pokemon.types[0]}
        onClick={() => pokedex.openPokemon(summary.id)}
      >
        <span className={styles.artworkFrame}>
          <PokemonArtwork
            className={styles.artwork}
            sources={pokedex.isShiny ? pokemon.artwork.shiny : pokemon.artwork.normal}
            alt=""
          />
        </span>
        <span className={styles.number}>{number}</span>
        <span className={styles.name}>{summary.name}</span>
        <TypeBadgeList types={pokemon.types} />
      </button>
    )
  }

  if (card?.status === 'error') {
    return (
      <div className={`${styles.card} ${styles.static}`}>
        <span className={`${styles.artworkFrame} ${styles.errorFrame}`} aria-hidden="true">
          !
        </span>
        <span className={styles.number}>{number}</span>
        <span className={styles.name}>{summary.name}</span>
        <p className={styles.errorText} role="alert">
          {card.message}
        </p>
        <button
          type="button"
          className="button"
          onClick={() => pokedex.retryCard(summary.id)}
          aria-label={`Retry loading ${summary.name}`}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`${styles.card} ${styles.static}`} aria-busy="true">
      <span className={`${styles.artworkFrame} skeleton`} />
      <span className={styles.number}>{number}</span>
      <span className={styles.name}>{summary.name}</span>
      <span className={`${styles.typesPlaceholder} skeleton`} />
      <span className="visually-hidden">Loading {summary.name}</span>
    </div>
  )
})

/** Placeholder card shown before the Pokédex index has loaded. */
export function CardSkeleton() {
  return (
    <div className={`${styles.card} ${styles.static}`} aria-hidden="true">
      <span className={`${styles.artworkFrame} skeleton`} />
      <span className={`${styles.textPlaceholder} skeleton`} />
      <span className={`${styles.textPlaceholder} ${styles.wide} skeleton`} />
      <span className={`${styles.typesPlaceholder} skeleton`} />
    </div>
  )
}
