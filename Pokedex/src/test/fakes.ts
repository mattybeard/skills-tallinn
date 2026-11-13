import type { Pokemon, PokemonService, PokemonSummary } from '../services/PokeApiService'
import { formatDisplayName } from '../services/pokemonNames'

export function makeSummaries(slugs: string[]): PokemonSummary[] {
  return slugs.map((slug, index) => ({ id: index + 1, slug, name: formatDisplayName(slug) }))
}

export function makePokemon(id: number, overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id,
    types: ['electric'],
    heightMetres: 0.4,
    weightKilograms: 6,
    stats: [
      { key: 'hp', label: 'HP', value: 35 },
      { key: 'attack', label: 'Attack', value: 55 },
    ],
    abilities: [
      { name: 'Static', isHidden: false },
      { name: 'Lightning Rod', isHidden: true },
    ],
    artwork: {
      normal: [`https://img.test/${id}.png`],
      shiny: [`https://img.test/shiny/${id}.png`],
    },
    ...overrides,
  }
}

interface PendingRequest {
  id: number
  signal: AbortSignal | undefined
  resolve: (pokemon: Pokemon) => void
  reject: (error: unknown) => void
}

/** A controllable PokemonService: tests decide when and how each request settles. */
export class FakePokemonService implements PokemonService {
  index: PokemonSummary[]
  indexError: unknown = null
  readonly cache = new Map<number, Pokemon>()
  readonly pending: PendingRequest[] = []
  autoResolve: boolean

  constructor(index: PokemonSummary[], { autoResolve = true }: { autoResolve?: boolean } = {}) {
    this.index = index
    this.autoResolve = autoResolve
  }

  getSpeciesIndex(): Promise<PokemonSummary[]> {
    if (this.indexError !== null) return Promise.reject(this.indexError)
    return Promise.resolve(this.index)
  }

  getPokemon(id: number, signal?: AbortSignal): Promise<Pokemon> {
    if (this.autoResolve) return Promise.resolve(makePokemon(id))
    return new Promise((resolve, reject) => {
      this.pending.push({ id, signal, resolve, reject })
    })
  }

  getCachedPokemon(id: number): Pokemon | undefined {
    return this.cache.get(id)
  }

  resolve(id: number, pokemon: Pokemon = makePokemon(id)): void {
    this.#take(id).resolve(pokemon)
  }

  reject(id: number, error: unknown = new Error('boom')): void {
    this.#take(id).reject(error)
  }

  #take(id: number): PendingRequest {
    const index = this.pending.findIndex((request) => request.id === id)
    if (index === -1) throw new Error(`No pending request for ${id}`)
    return this.pending.splice(index, 1)[0]
  }
}
