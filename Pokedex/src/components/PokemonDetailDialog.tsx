import { observer } from 'mobx-react-lite'
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { useService } from '../app/serviceContext'
import { formatPokedexNumber } from '../services/pokemonNames'
import { PokemonArtwork } from './PokemonArtwork'
import { ShinyToggle } from './ShinyToggle'
import { TypeBadgeList } from './TypeBadge'
import styles from './PokemonDetailDialog.module.css'

const MAX_BASE_STAT = 255

export const PokemonDetailDialog = observer(function PokemonDetailDialog() {
  const pokedex = useService('pokedex')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const summary = pokedex.selectedSummary
  const pokemon = pokedex.selectedPokemon
  const isOpen = summary !== undefined && pokemon !== undefined

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return

    if (isOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // The native "close" event covers Escape, the close button and backdrop clicks.
  const handleClose = (): void => {
    pokedex.closePokemon()
    returnFocusRef.current?.focus()
    returnFocusRef.current = null
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) event.currentTarget.close()
  }

  // Native dialogs close on Escape, but some embedded browsers skip that, so handle it explicitly.
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>): void => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.currentTarget.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="pokemon-detail-title"
      onClose={handleClose}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-type={pokemon?.types[0]}
    >
      {isOpen && (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <ShinyToggle />
            <button
              type="button"
              className={`button ${styles.closeButton}`}
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className={styles.hero}>
            <PokemonArtwork
              className={styles.artwork}
              sources={pokedex.isShiny ? pokemon.artwork.shiny : pokemon.artwork.normal}
              alt={`${summary.name}${pokedex.isShiny ? ' (shiny)' : ''} artwork`}
            />
          </div>

          <p className={styles.number}>{formatPokedexNumber(pokemon.id)}</p>
          <h2 id="pokemon-detail-title" className={styles.name}>
            {summary.name}
          </h2>
          <TypeBadgeList types={pokemon.types} />

          <dl className={styles.measurements}>
            <div>
              <dt>Height</dt>
              <dd>{pokemon.heightMetres.toFixed(1)} m</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{pokemon.weightKilograms.toFixed(1)} kg</dd>
            </div>
          </dl>

          <section className={styles.section} aria-labelledby="pokemon-detail-stats">
            <h3 id="pokemon-detail-stats">Base stats</h3>
            <ul className={styles.stats}>
              {pokemon.stats.map((stat) => (
                <li key={stat.key} className={styles.stat}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statTrack} aria-hidden="true">
                    <span
                      className={styles.statBar}
                      style={{ width: `${Math.min(100, (stat.value / MAX_BASE_STAT) * 100)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="pokemon-detail-abilities">
            <h3 id="pokemon-detail-abilities">Abilities</h3>
            <ul className={styles.abilities}>
              {pokemon.abilities.map((ability) => (
                <li key={ability.name} className={styles.ability}>
                  {ability.name}
                  {ability.isHidden && <span className={styles.hiddenTag}>Hidden</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </dialog>
  )
})
