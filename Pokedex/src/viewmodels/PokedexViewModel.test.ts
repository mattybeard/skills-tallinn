import { describe, expect, it, vi } from 'vitest'
import { FakePokemonService, makePokemon, makeSummaries } from '../test/fakes'
import { PAGE_SIZE, PokedexViewModel } from './PokedexViewModel'

const slugs = Array.from({ length: 30 }, (_, index) => `mon-${index + 1}`)
slugs[0] = 'pikachu'
slugs[1] = 'pichu'
slugs[2] = 'mr-mime'

async function createLoadedViewModel(service = new FakePokemonService(makeSummaries(slugs))) {
  const viewModel = new PokedexViewModel(service)
  await viewModel.loadIndex()
  return { viewModel, service }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('PokedexViewModel', () => {
  it('loads the index and the first page of cards', async () => {
    const { viewModel } = await createLoadedViewModel()
    await flush()

    expect(viewModel.indexStatus).toBe('loaded')
    expect(viewModel.pageCount).toBe(3)
    expect(viewModel.pageItems.map((summary) => summary.id)).toEqual(Array.from({ length: PAGE_SIZE }, (_, i) => i + 1))
    expect(viewModel.cards.get(1)?.status).toBe('loaded')
  })

  it('records an index failure and recovers on retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const service = new FakePokemonService(makeSummaries(slugs))
    service.indexError = new Error('offline')
    const viewModel = new PokedexViewModel(service)

    await viewModel.loadIndex()
    expect(viewModel.indexStatus).toBe('error')

    service.indexError = null
    await viewModel.loadIndex()
    expect(viewModel.indexStatus).toBe('loaded')
  })

  it('matches partial names, punctuation-free names and exact numbers', async () => {
    const { viewModel } = await createLoadedViewModel()

    viewModel.setQuery('pi')
    expect(viewModel.results.map((summary) => summary.name)).toEqual(['Pikachu', 'Pichu'])

    viewModel.setQuery('mr mime')
    expect(viewModel.results.map((summary) => summary.name)).toEqual(['Mr. Mime'])

    viewModel.setQuery('#2')
    expect(viewModel.results.map((summary) => summary.id)).toEqual([2])
  })

  it('resets to page 1 for a new search and restores the browse page when cleared', async () => {
    const { viewModel } = await createLoadedViewModel()
    viewModel.goToPage(3)

    viewModel.setQuery('mon')
    expect(viewModel.page).toBe(1)

    viewModel.goToPage(2)
    viewModel.setQuery('mon-1')
    expect(viewModel.page).toBe(1)

    viewModel.clearSearch()
    expect(viewModel.page).toBe(3)
  })

  it('keeps the page when only surrounding whitespace changes', async () => {
    const { viewModel } = await createLoadedViewModel()
    viewModel.setQuery('mon')
    viewModel.goToPage(2)

    viewModel.setQuery('mon ')

    expect(viewModel.page).toBe(2)
  })

  it('clamps page navigation to the available range', async () => {
    const { viewModel } = await createLoadedViewModel()

    viewModel.goToPage(99)
    expect(viewModel.page).toBe(3)

    viewModel.goToPage(-4)
    expect(viewModel.page).toBe(1)
  })

  it('ignores results from a page the user has already left', async () => {
    const service = new FakePokemonService(makeSummaries(slugs), { autoResolve: false })
    const { viewModel } = await createLoadedViewModel(service)
    const firstPageRequest = service.pending.find((request) => request.id === 1)

    viewModel.goToPage(2)
    expect(firstPageRequest?.signal?.aborted).toBe(true)

    service.resolve(1)
    service.resolve(13)
    await flush()

    expect(viewModel.cards.has(1)).toBe(false)
    expect(viewModel.cards.get(13)?.status).toBe('loaded')
  })

  it('shows cached Pokémon immediately without a loading state', async () => {
    const service = new FakePokemonService(makeSummaries(slugs), { autoResolve: false })
    service.cache.set(1, makePokemon(1))

    const { viewModel } = await createLoadedViewModel(service)

    expect(viewModel.cards.get(1)?.status).toBe('loaded')
    expect(viewModel.cards.get(2)?.status).toBe('loading')
    expect(service.pending.some((request) => request.id === 1)).toBe(false)
  })

  it('marks a failed card as an error and reloads it on retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const service = new FakePokemonService(makeSummaries(slugs), { autoResolve: false })
    const { viewModel } = await createLoadedViewModel(service)

    service.reject(4)
    await flush()
    expect(viewModel.cards.get(4)?.status).toBe('error')

    viewModel.retryCard(4)
    expect(viewModel.cards.get(4)?.status).toBe('loading')

    service.resolve(4)
    await flush()
    expect(viewModel.cards.get(4)?.status).toBe('loaded')
  })

  it('only opens Pokémon whose details have loaded', async () => {
    const service = new FakePokemonService(makeSummaries(slugs), { autoResolve: false })
    const { viewModel } = await createLoadedViewModel(service)

    viewModel.openPokemon(1)
    expect(viewModel.selectedId).toBeNull()

    service.resolve(1)
    await flush()
    viewModel.openPokemon(1)
    expect(viewModel.selectedPokemon?.id).toBe(1)
    expect(viewModel.selectedSummary?.name).toBe('Pikachu')

    viewModel.closePokemon()
    expect(viewModel.selectedId).toBeNull()
  })

  it('toggles shiny artwork mode', async () => {
    const { viewModel } = await createLoadedViewModel()

    viewModel.toggleShiny()
    expect(viewModel.isShiny).toBe(true)

    viewModel.toggleShiny()
    expect(viewModel.isShiny).toBe(false)
  })
})
