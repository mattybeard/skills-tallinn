import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useService } from '../app/serviceContext'
import styles from './SearchBox.module.css'

const SEARCH_DEBOUNCE_MS = 300

export const SearchBox = observer(function SearchBox() {
  const pokedex = useService('pokedex')
  const [draft, setDraft] = useState(pokedex.query)
  const [lastCommitted, setLastCommitted] = useState(pokedex.query)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(debounceTimer.current), [])

  // Pick up commits made elsewhere, such as the "Clear search" button in the empty state.
  if (pokedex.query !== lastCommitted) {
    setLastCommitted(pokedex.query)
    setDraft(pokedex.query)
  }

  const commit = (value: string): void => {
    clearTimeout(debounceTimer.current)
    pokedex.setQuery(value)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value
    setDraft(value)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => pokedex.setQuery(value), SEARCH_DEBOUNCE_MS)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    commit(draft)
  }

  return (
    <form role="search" className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="pokemon-search" className="visually-hidden">
        Search Pokémon by name or number
      </label>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id="pokemon-search"
        className={styles.input}
        type="search"
        placeholder="Search by name or number"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onChange={handleChange}
      />
    </form>
  )
})
