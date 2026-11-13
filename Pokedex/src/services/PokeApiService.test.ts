import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokeApiError, PokeApiService } from './PokeApiService'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const pikachuPayload = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  types: [{ slot: 1, type: { name: 'electric' } }],
  stats: [
    { base_stat: 35, stat: { name: 'hp' } },
    { base_stat: 50, stat: { name: 'special-attack' } },
  ],
  abilities: [
    { slot: 3, is_hidden: true, ability: { name: 'lightning-rod' } },
    { slot: 1, is_hidden: false, ability: { name: 'static' } },
  ],
  sprites: {
    front_default: 'https://sprites/25.png',
    front_shiny: null,
    other: { 'official-artwork': { front_default: 'https://art/25.png', front_shiny: 'https://art/shiny/25.png' } },
  },
}

describe('PokeApiService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps the species list to sorted summaries with display names and drops IDs above #1025', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { name: 'mr-mime', url: 'https://pokeapi.co/api/v2/pokemon-species/122/' },
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
          { name: 'future-mon', url: 'https://pokeapi.co/api/v2/pokemon-species/1026/' },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const index = await new PokeApiService('https://api.test').getSpeciesIndex()

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/pokemon-species?limit=1025', { signal: undefined })
    expect(index).toEqual([
      { id: 1, slug: 'bulbasaur', name: 'Bulbasaur' },
      { id: 122, slug: 'mr-mime', name: 'Mr. Mime' },
    ])
  })

  it('maps a Pokémon payload and orders abilities by slot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(pikachuPayload)))

    const pokemon = await new PokeApiService('https://api.test').getPokemon(25)

    expect(pokemon).toEqual({
      id: 25,
      types: ['electric'],
      heightMetres: 0.4,
      weightKilograms: 6,
      stats: [
        { key: 'hp', label: 'HP', value: 35 },
        { key: 'special-attack', label: 'Sp. Atk', value: 50 },
      ],
      abilities: [
        { name: 'Static', isHidden: false },
        { name: 'Lightning Rod', isHidden: true },
      ],
      artwork: {
        normal: ['https://art/25.png', 'https://sprites/25.png'],
        shiny: ['https://art/shiny/25.png'],
      },
    })
  })

  it('caches Pokémon so a second request does not hit the network', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(pikachuPayload))
    vi.stubGlobal('fetch', fetchMock)
    const service = new PokeApiService('https://api.test')

    const first = await service.getPokemon(25)
    const second = await service.getPokemon(25)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    expect(service.getCachedPokemon(25)).toBe(first)
  })

  it('throws a PokeApiError with the status for a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 503)))

    const request = new PokeApiService('https://api.test').getPokemon(25)

    await expect(request).rejects.toBeInstanceOf(PokeApiError)
    await expect(request).rejects.toMatchObject({ status: 503 })
  })

  it('rejects a payload with missing fields and does not cache it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 25, types: 'electric' })))
    const service = new PokeApiService('https://api.test')

    await expect(service.getPokemon(25)).rejects.toThrow(/Unexpected PokéAPI response/)
    expect(service.getCachedPokemon(25)).toBeUndefined()
  })

  it('passes the abort signal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(pikachuPayload))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await new PokeApiService('https://api.test').getPokemon(25, controller.signal)

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/pokemon/25', { signal: controller.signal })
  })
})
