import { formatName, formatNumber, type Pokemon } from '../api'
import { Artwork } from './Artwork'
import { TypeBadge } from './TypeBadge'

interface PokemonCardProps {
  pokemon: Pokemon
  shiny: boolean
  onSelect: (pokemon: Pokemon) => void
}

export function PokemonCard({ pokemon, shiny, onSelect }: PokemonCardProps) {
  const primaryType = pokemon.types[0] ?? 'normal'

  return (
    <li>
      <button
        type="button"
        className={`card type-bg-${primaryType}`}
        onClick={() => onSelect(pokemon)}
        aria-label={`View details for ${formatName(pokemon.name)}, ${formatNumber(pokemon.id)}`}
      >
        <span className="card-number">{formatNumber(pokemon.id)}</span>
        <Artwork pokemon={pokemon} shiny={shiny} className="card-art" />
        <span className="card-name">{formatName(pokemon.name)}</span>
        <span className="type-list">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </span>
      </button>
    </li>
  )
}

export function PokemonCardSkeleton() {
  return (
    <li className="card skeleton" aria-hidden="true">
      <span className="skeleton-block skeleton-number" />
      <span className="skeleton-block skeleton-art" />
      <span className="skeleton-block skeleton-name" />
      <span className="skeleton-block skeleton-types" />
    </li>
  )
}
