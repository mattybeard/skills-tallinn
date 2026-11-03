import { useEffect, useRef } from 'react'
import { formatName, formatNumber, type Pokemon } from '../api'
import { Artwork } from './Artwork'
import { TypeBadge } from './TypeBadge'

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

const MAX_BASE_STAT = 255

interface PokemonDetailProps {
  pokemon: Pokemon
  shiny: boolean
  onToggleShiny: () => void
  onClose: () => void
}

export function PokemonDetail({ pokemon, shiny, onToggleShiny, onClose }: PokemonDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const primaryType = pokemon.types[0] ?? 'normal'
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)
  const titleId = `pokemon-${pokemon.id}-title`

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="detail"
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <article className="detail-body">
        <header className={`detail-hero type-bg-${primaryType}`}>
          <button type="button" className="icon-button detail-close" onClick={onClose} aria-label="Close details">
            ×
          </button>
          <p className="detail-number">{formatNumber(pokemon.id)}</p>
          <h2 id={titleId}>{formatName(pokemon.name)}</h2>
          <div className="type-list">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
          <Artwork pokemon={pokemon} shiny={shiny} className="detail-art" />
          <button
            type="button"
            className={`shiny-toggle ${shiny ? 'is-active' : ''}`}
            aria-pressed={shiny}
            onClick={onToggleShiny}
          >
            ✦ {shiny ? 'Shiny' : 'Normal'} artwork
          </button>
        </header>

        <div className="detail-content">
          <dl className="detail-facts">
            <div>
              <dt>Height</dt>
              <dd>{(pokemon.height / 10).toFixed(1)} m</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{(pokemon.weight / 10).toFixed(1)} kg</dd>
            </div>
          </dl>

          <section aria-labelledby={`${titleId}-abilities`}>
            <h3 id={`${titleId}-abilities`}>Abilities</h3>
            <ul className="ability-list">
              {pokemon.abilities.map((ability) => (
                <li key={ability.name} className={ability.hidden ? 'is-hidden' : ''}>
                  {formatName(ability.name)}
                  {ability.hidden && <span className="ability-tag">Hidden</span>}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby={`${titleId}-stats`}>
            <h3 id={`${titleId}-stats`}>Base stats</h3>
            <table className="stats">
              <tbody>
                {pokemon.stats.map((stat) => (
                  <tr key={stat.name}>
                    <th scope="row">{STAT_LABELS[stat.name] ?? formatName(stat.name)}</th>
                    <td className="stat-value">{stat.value}</td>
                    <td className="stat-bar-cell">
                      <span className="stat-bar" aria-hidden="true">
                        <span
                          className={`stat-fill ${stat.value >= 100 ? 'is-high' : stat.value < 50 ? 'is-low' : ''}`}
                          style={{ width: `${Math.min(100, (stat.value / MAX_BASE_STAT) * 100)}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="stat-total">
                  <th scope="row">Total</th>
                  <td className="stat-value">{total}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </article>
    </dialog>
  )
}
