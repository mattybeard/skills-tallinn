import { makeAutoObservable, runInAction } from 'mobx'
import type { Pokemon, PokemonService, PokemonSummary } from '../services/PokeApiService'
import { toSearchKey } from '../services/pokemonNames'

export const PAGE_SIZE = 12

export type IndexStatus = 'idle' | 'loading' | 'loaded' | 'error'

export type CardState =
  | { status: 'loading' }
  | { status: 'loaded'; pokemon: Pokemon }
  | { status: 'error'; message: string }

export class PokedexViewModel {
  index: PokemonSummary[] = []
  indexStatus: IndexStatus = 'idle'
  /** The committed search text. The search box keeps its own draft until it commits. */
  query = ''
  page = 1
  isShiny = false
  selectedId: number | null = null
  /** Load state for the cards on the current page, keyed by Pokédex number. */
  cards = new Map<number, CardState>()
  /** The browse page to return to when the search is cleared. */
  private browsePage = 1

  readonly #pokemonService: PokemonService
  #pageController: AbortController | null = null

  constructor(pokemonService: PokemonService) {
    this.#pokemonService = pokemonService
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get isSearching(): boolean {
    return this.query.trim() !== ''
  }

  get results(): PokemonSummary[] {
    const query = this.query.trim()
    if (query === '') return this.index

    const numberMatch = /^#?(\d+)$/.exec(query)
    if (numberMatch) {
      const id = Number(numberMatch[1])
      return this.index.filter((summary) => summary.id === id)
    }

    const key = toSearchKey(query)
    if (key === '') return []
    return this.index.filter(
      (summary) => toSearchKey(summary.slug).includes(key) || toSearchKey(summary.name).includes(key),
    )
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.results.length / PAGE_SIZE))
  }

  get pageItems(): PokemonSummary[] {
    const start = (this.page - 1) * PAGE_SIZE
    return this.results.slice(start, start + PAGE_SIZE)
  }

  get selectedSummary(): PokemonSummary | undefined {
    if (this.selectedId === null) return undefined
    return this.index.find((summary) => summary.id === this.selectedId)
  }

  get selectedPokemon(): Pokemon | undefined {
    if (this.selectedId === null) return undefined
    const card = this.cards.get(this.selectedId)
    return card?.status === 'loaded' ? card.pokemon : undefined
  }

  async loadIndex(): Promise<void> {
    if (this.indexStatus === 'loading' || this.indexStatus === 'loaded') return
    this.indexStatus = 'loading'

    try {
      const index = await this.#pokemonService.getSpeciesIndex()
      runInAction(() => {
        this.index = index
        this.indexStatus = 'loaded'
        this.loadCurrentPage()
      })
    } catch (error) {
      console.error('Failed to load the Pokédex index', error)
      runInAction(() => {
        this.indexStatus = 'error'
      })
    }
  }

  setQuery(query: string): void {
    if (query === this.query) return

    const wasSearching = this.isSearching
    const previousKey = this.query.trim()
    this.query = query
    const isSearching = this.isSearching

    if (!wasSearching && isSearching) {
      this.browsePage = this.page
      this.page = 1
    } else if (wasSearching && !isSearching) {
      this.page = this.browsePage
    } else if (query.trim() !== previousKey) {
      this.page = 1
    } else {
      return
    }

    this.loadCurrentPage()
  }

  clearSearch(): void {
    this.setQuery('')
  }

  goToPage(page: number): void {
    const target = Math.min(Math.max(1, Math.trunc(page)), this.pageCount)
    if (target === this.page) return
    this.page = target
    this.loadCurrentPage()
  }

  retryCard(id: number): void {
    if (this.#pageController === null) return
    this.#loadCard(id, this.#pageController.signal)
  }

  toggleShiny(): void {
    this.isShiny = !this.isShiny
  }

  openPokemon(id: number): void {
    if (this.cards.get(id)?.status !== 'loaded') return
    this.selectedId = id
  }

  closePokemon(): void {
    this.selectedId = null
  }

  private loadCurrentPage(): void {
    this.#pageController?.abort()
    const controller = new AbortController()
    this.#pageController = controller

    this.cards.clear()
    for (const summary of this.pageItems) {
      this.#loadCard(summary.id, controller.signal)
    }
  }

  #loadCard(id: number, signal: AbortSignal): void {
    const cached = this.#pokemonService.getCachedPokemon(id)
    if (cached) {
      runInAction(() => this.cards.set(id, { status: 'loaded', pokemon: cached }))
      return
    }

    runInAction(() => this.cards.set(id, { status: 'loading' }))

    this.#pokemonService.getPokemon(id, signal).then(
      (pokemon) => {
        if (signal.aborted) return
        runInAction(() => this.cards.set(id, { status: 'loaded', pokemon }))
      },
      (error: unknown) => {
        if (signal.aborted) return
        console.error(`Failed to load Pokémon ${id}`, error)
        runInAction(() => this.cards.set(id, { status: 'error', message: "Couldn't load this Pokémon." }))
      },
    )
  }
}
