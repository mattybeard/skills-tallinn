import { useEffect, useMemo, useState } from 'react'
import { fetchPokedexIndex, fetchPokemon, type Pokemon, type PokemonSummary } from './api'
import { Pagination } from './components/Pagination'
import { PokemonCard, PokemonCardSkeleton } from './components/PokemonCard'
import { PokemonDetail } from './components/PokemonDetail'
import { StatusMessage } from './components/StatusMessage'
import './App.css'

const PAGE_SIZE = 12
const SEARCH_DELAY_MS = 250

type Result<T> = { attempt: number; data: T; error?: never } | { attempt: number; data?: never; error: Error }

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search)
  const page = Number(params.get('page'))
  return {
    query: params.get('q') ?? '',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

function matchesQuery(entry: PokemonSummary, query: string): boolean {
  const numberQuery = query.replace(/^#/, '')
  if (/^\d+$/.test(numberQuery)) return entry.id === Number(numberQuery)
  return entry.name.includes(query.replace(/\s+/g, '-'))
}

function App() {
  const [initial] = useState(readUrlState)
  const [searchInput, setSearchInput] = useState(initial.query)
  const [query, setQuery] = useState(initial.query.trim().toLowerCase())
  const [page, setPage] = useState(initial.page)
  const [shiny, setShiny] = useState(false)
  const [selected, setSelected] = useState<Pokemon | null>(null)

  const [indexAttempt, setIndexAttempt] = useState(0)
  const [indexResult, setIndexResult] = useState<Result<PokemonSummary[]> | null>(null)
  const [pageAttempt, setPageAttempt] = useState(0)
  const [pageResult, setPageResult] = useState<(Result<Pokemon[]> & { key: string }) | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchInput.trim().toLowerCase()), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let active = true
    fetchPokedexIndex().then(
      (data) => active && setIndexResult({ attempt: indexAttempt, data }),
      (error: unknown) => active && setIndexResult({ attempt: indexAttempt, error: toError(error) }),
    )
    return () => {
      active = false
    }
  }, [indexAttempt])

  const index = indexResult?.attempt === indexAttempt ? indexResult : null
  const matches = useMemo(
    () => (index?.data ? (query ? index.data.filter((entry) => matchesQuery(entry, query)) : index.data) : []),
    [index, query],
  )
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageIds = useMemo(
    () => matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((entry) => entry.id),
    [matches, currentPage],
  )
  const pageKey = `${pageIds.join(',')}|${pageAttempt}`

  useEffect(() => {
    if (pageIds.length === 0) return
    let active = true
    Promise.all(pageIds.map(fetchPokemon)).then(
      (data) => active && setPageResult({ key: pageKey, attempt: pageAttempt, data }),
      (error: unknown) => active && setPageResult({ key: pageKey, attempt: pageAttempt, error: toError(error) }),
    )
    return () => {
      active = false
    }
  }, [pageIds, pageKey, pageAttempt])

  useEffect(() => {
    if (!index?.data) return
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (currentPage > 1) params.set('page', String(currentPage))
    const search = params.toString()
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname)
  }, [index, query, currentPage])

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentPageResult = pageResult?.key === pageKey ? pageResult : null
  const isSearching = searchInput.trim().toLowerCase() !== query

  let content
  if (index?.error) {
    content = (
      <StatusMessage
        tone="error"
        title="Couldn't load the Pokédex"
        message="The PokéAPI didn't respond. Check your connection and try again."
        onRetry={() => setIndexAttempt((n) => n + 1)}
      />
    )
  } else if (index && matches.length === 0) {
    content = (
      <StatusMessage
        title="No Pokémon found"
        message={`Nothing matches "${searchInput.trim()}". Try another name or Pokédex number.`}
      />
    )
  } else if (currentPageResult?.error) {
    content = (
      <StatusMessage
        tone="error"
        title="Couldn't load these Pokémon"
        message="Some Pokémon details failed to load. Try again in a moment."
        onRetry={() => setPageAttempt((n) => n + 1)}
      />
    )
  } else if (!currentPageResult?.data) {
    content = (
      <ul className="grid" aria-busy="true" aria-label="Loading Pokémon">
        {Array.from({ length: index ? pageIds.length || PAGE_SIZE : PAGE_SIZE }, (_, i) => (
          <PokemonCardSkeleton key={i} />
        ))}
      </ul>
    )
  } else {
    content = (
      <ul className="grid" aria-label="Pokémon">
        {currentPageResult.data.map((pokemon) => (
          <PokemonCard key={pokemon.id} pokemon={pokemon} shiny={shiny} onSelect={setSelected} />
        ))}
      </ul>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="pokeball" aria-hidden="true" />
          <h1>Pokédex</h1>
        </div>

        <div className="controls">
          <label className="search">
            <span className="visually-hidden">Search by name or Pokédex number</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4a6 6 0 1 0 3.7 10.7l4.8 4.8 1.4-1.4-4.8-4.8A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
            </svg>
            <input
              type="search"
              value={searchInput}
              placeholder="Name or number"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setSearchInput(event.target.value)
                setPage(1)
              }}
            />
            {isSearching && <span className="spinner" aria-hidden="true" />}
          </label>

          <button
            type="button"
            className={`shiny-toggle ${shiny ? 'is-active' : ''}`}
            aria-pressed={shiny}
            onClick={() => setShiny((value) => !value)}
          >
            ✦ Shiny
          </button>
        </div>
      </header>

      <main>
        <p className="result-count" aria-live="polite">
          {index?.data
            ? query
              ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`
              : `${matches.length} Pokémon`
            : '\u00a0'}
        </p>
        {content}
        {index?.data && matches.length > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={changePage} />
        )}
      </main>

      <footer className="app-footer">
        Data from <a href="https://pokeapi.co/">PokéAPI</a>. Pokémon and Pokémon character names are trademarks of
        Nintendo.
      </footer>

      {selected && (
        <PokemonDetail
          key={selected.id}
          pokemon={selected}
          shiny={shiny}
          onToggleShiny={() => setShiny((value) => !value)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

export default App
