const API_BASE = 'https://pokeapi.co/api/v2'

export interface PokemonSummary {
  id: number
  name: string
}

export interface PokemonStat {
  name: string
  value: number
}

export interface PokemonAbility {
  name: string
  hidden: boolean
}

export interface Pokemon {
  id: number
  name: string
  types: string[]
  artwork: string | null
  shinyArtwork: string | null
  height: number
  weight: number
  stats: PokemonStat[]
  abilities: PokemonAbility[]
}

interface NamedResource {
  name: string
  url: string
}

interface SpeciesListResponse {
  results: NamedResource[]
}

interface PokemonResponse {
  id: number
  name: string
  height: number
  weight: number
  types: { slot: number; type: NamedResource }[]
  stats: { base_stat: number; stat: NamedResource }[]
  abilities: { is_hidden: boolean; slot: number; ability: NamedResource }[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      'official-artwork'?: {
        front_default: string | null
        front_shiny: string | null
      }
    }
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`PokéAPI request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : NaN
}

let indexPromise: Promise<PokemonSummary[]> | null = null

// Species IDs match National Pokédex numbers, so the species list doubles as the Pokédex index.
export function fetchPokedexIndex(): Promise<PokemonSummary[]> {
  if (!indexPromise) {
    indexPromise = getJson<SpeciesListResponse>(`${API_BASE}/pokemon-species?limit=100000`)
      .then((data) =>
        data.results
          .map((entry) => ({ id: idFromUrl(entry.url), name: entry.name }))
          .filter((entry) => Number.isFinite(entry.id))
          .sort((a, b) => a.id - b.id),
      )
      .catch((error: unknown) => {
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

const pokemonCache = new Map<number, Promise<Pokemon>>()

function toPokemon(data: PokemonResponse): Pokemon {
  const artwork = data.sprites.other?.['official-artwork']
  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: [...data.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    artwork: artwork?.front_default ?? data.sprites.front_default,
    shinyArtwork: artwork?.front_shiny ?? data.sprites.front_shiny,
    stats: data.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    abilities: [...data.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
  }
}

export function fetchPokemon(id: number): Promise<Pokemon> {
  let request = pokemonCache.get(id)
  if (!request) {
    request = getJson<PokemonResponse>(`${API_BASE}/pokemon/${id}`)
      .then(toPokemon)
      .catch((error: unknown) => {
        pokemonCache.delete(id)
        throw error
      })
    pokemonCache.set(id, request)
  }
  return request
}

export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}
