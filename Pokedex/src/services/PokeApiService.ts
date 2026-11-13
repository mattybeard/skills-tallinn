import { formatDisplayName, titleCase } from './pokemonNames'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2'
export const MAX_POKEDEX_NUMBER = 1025

export interface PokemonSummary {
  id: number
  slug: string
  name: string
}

export interface PokemonStat {
  key: string
  label: string
  value: number
}

export interface PokemonAbility {
  name: string
  isHidden: boolean
}

/** Artwork URLs in fallback order: official artwork first, then the small sprite. */
export interface PokemonArtwork {
  normal: string[]
  shiny: string[]
}

export interface Pokemon {
  id: number
  types: string[]
  heightMetres: number
  weightKilograms: number
  stats: PokemonStat[]
  abilities: PokemonAbility[]
  artwork: PokemonArtwork
}

export interface PokemonService {
  getSpeciesIndex(signal?: AbortSignal): Promise<PokemonSummary[]>
  getPokemon(id: number, signal?: AbortSignal): Promise<Pokemon>
  getCachedPokemon(id: number): Pokemon | undefined
}

export class PokeApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'PokeApiError'
    this.status = status
  }
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

export class PokeApiService implements PokemonService {
  readonly #baseUrl: string
  readonly #pokemonCache = new Map<number, Pokemon>()

  constructor(baseUrl: string = POKEAPI_BASE_URL) {
    this.#baseUrl = baseUrl
  }

  async getSpeciesIndex(signal?: AbortSignal): Promise<PokemonSummary[]> {
    const data = await this.#fetchJson(`${this.#baseUrl}/pokemon-species?limit=${MAX_POKEDEX_NUMBER}`, signal)
    return mapSpeciesIndex(data)
  }

  async getPokemon(id: number, signal?: AbortSignal): Promise<Pokemon> {
    const cached = this.#pokemonCache.get(id)
    if (cached) return cached

    const data = await this.#fetchJson(`${this.#baseUrl}/pokemon/${id}`, signal)
    const pokemon = mapPokemon(data)
    this.#pokemonCache.set(id, pokemon)
    return pokemon
  }

  getCachedPokemon(id: number): Pokemon | undefined {
    return this.#pokemonCache.get(id)
  }

  async #fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(url, { signal })
    if (!response.ok) {
      throw new PokeApiError(`PokéAPI request failed (${response.status})`, response.status)
    }
    return response.json() as Promise<unknown>
  }
}

type JsonRecord = Record<string, unknown>

function invalidResponse(detail: string): PokeApiError {
  return new PokeApiError(`Unexpected PokéAPI response: ${detail}`)
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readRecord(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) throw invalidResponse(`${path} is not an object`)
  return value
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw invalidResponse(`${path} is not an array`)
  return value
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw invalidResponse(`${path} is not a string`)
  return value
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalidResponse(`${path} is not a number`)
  return value
}

function readOptionalUrl(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function mapSpeciesIndex(data: unknown): PokemonSummary[] {
  const results = readArray(readRecord(data, 'species list').results, 'species list results')

  return results
    .map((entry, index) => {
      const record = readRecord(entry, `results[${index}]`)
      const slug = readString(record.name, `results[${index}].name`)
      const url = readString(record.url, `results[${index}].url`)
      const idMatch = /\/pokemon-species\/(\d+)\/?$/.exec(url)
      if (!idMatch) throw invalidResponse(`results[${index}].url has no species id`)
      return { id: Number(idMatch[1]), slug, name: formatDisplayName(slug) }
    })
    .filter((summary) => summary.id <= MAX_POKEDEX_NUMBER)
    .sort((a, b) => a.id - b.id)
}

function mapPokemon(data: unknown): Pokemon {
  const record = readRecord(data, 'pokemon')

  const types = readArray(record.types, 'types')
    .map((entry, index) => {
      const typeEntry = readRecord(entry, `types[${index}]`)
      return {
        slot: readNumber(typeEntry.slot, `types[${index}].slot`),
        name: readString(readRecord(typeEntry.type, `types[${index}].type`).name, `types[${index}].type.name`),
      }
    })
    .sort((a, b) => a.slot - b.slot)
    .map((type) => type.name)

  const stats = readArray(record.stats, 'stats').map((entry, index) => {
    const statEntry = readRecord(entry, `stats[${index}]`)
    const key = readString(readRecord(statEntry.stat, `stats[${index}].stat`).name, `stats[${index}].stat.name`)
    return {
      key,
      label: STAT_LABELS[key] ?? titleCase(key),
      value: readNumber(statEntry.base_stat, `stats[${index}].base_stat`),
    }
  })

  const abilities = readArray(record.abilities, 'abilities')
    .map((entry, index) => {
      const abilityEntry = readRecord(entry, `abilities[${index}]`)
      const slug = readString(
        readRecord(abilityEntry.ability, `abilities[${index}].ability`).name,
        `abilities[${index}].ability.name`,
      )
      return {
        slot: readNumber(abilityEntry.slot, `abilities[${index}].slot`),
        name: titleCase(slug),
        isHidden: abilityEntry.is_hidden === true,
      }
    })
    .sort((a, b) => a.slot - b.slot)
    .map(({ name, isHidden }) => ({ name, isHidden }))

  return {
    id: readNumber(record.id, 'id'),
    types,
    heightMetres: readNumber(record.height, 'height') / 10,
    weightKilograms: readNumber(record.weight, 'weight') / 10,
    stats,
    abilities,
    artwork: mapArtwork(record.sprites),
  }
}

function mapArtwork(value: unknown): PokemonArtwork {
  const sprites = isRecord(value) ? value : {}
  const other = isRecord(sprites.other) ? sprites.other : {}
  const official = isRecord(other['official-artwork']) ? other['official-artwork'] : {}

  const present = (urls: (string | null)[]): string[] => urls.filter((url): url is string => url !== null)

  return {
    normal: present([readOptionalUrl(official.front_default), readOptionalUrl(sprites.front_default)]),
    shiny: present([readOptionalUrl(official.front_shiny), readOptionalUrl(sprites.front_shiny)]),
  }
}
