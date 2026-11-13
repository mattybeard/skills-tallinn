import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { createServiceProvider } from './app/ServiceProvider'
import { ServiceContext } from './app/serviceContext'
import { FakePokemonService, makeSummaries } from './test/fakes'

const slugs = ['bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'squirtle',
  'wartortle', 'blastoise', 'caterpie', 'metapod', 'butterfree', 'weedle', 'kakuna', 'beedrill']

function renderApp(service = new FakePokemonService(makeSummaries(slugs))) {
  render(
    <ServiceContext value={createServiceProvider(service)}>
      <App />
    </ServiceContext>,
  )
  return { service, user: userEvent.setup() }
}

describe('App', () => {
  it('shows a page of 12 cards and pages to the next set', async () => {
    const { user } = renderApp()

    expect(await screen.findByRole('button', { name: /bulbasaur/i })).toBeInTheDocument()
    expect(screen.getByText('Showing 1–12 of 15')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /weedle/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByRole('button', { name: /weedle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('filters cards as the user types and offers to clear an empty search', async () => {
    const { user } = renderApp()
    await screen.findByRole('button', { name: /bulbasaur/i })
    const search = screen.getByRole('searchbox', { name: /search pokémon/i })

    await user.type(search, 'char')

    expect(await screen.findByText('Search results 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /charizard/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /bulbasaur/i })).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzz{Enter}')
    expect(await screen.findByText('No Pokémon found')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(await screen.findByRole('button', { name: /bulbasaur/i })).toBeInTheDocument()
    expect(search).toHaveValue('')
  })

  it('opens a Pokémon with stats and abilities and switches to shiny artwork', async () => {
    const { user } = renderApp()

    await user.click(await screen.findByRole('button', { name: /charmander/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Charmander' })
    expect(within(dialog).getByText('HP')).toBeInTheDocument()
    expect(within(dialog).getByText('Lightning Rod')).toBeInTheDocument()
    expect(within(dialog).getByText('Hidden')).toBeInTheDocument()
    expect(within(dialog).getByRole('img', { name: 'Charmander artwork' })).toHaveAttribute(
      'src',
      'https://img.test/4.png',
    )

    await user.click(within(dialog).getByRole('button', { name: 'Shiny' }))

    expect(within(dialog).getByRole('img', { name: 'Charmander (shiny) artwork' })).toHaveAttribute(
      'src',
      'https://img.test/shiny/4.png',
    )

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const card = screen.getByRole('button', { name: /charmander/i })
    await user.click(card)
    const reopened = await screen.findByRole('dialog', { name: 'Charmander' })
    // Browsers move focus into a modal dialog; jsdom does not.
    within(reopened).getByRole('button', { name: 'Close' }).focus()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card).toHaveFocus()
  })

  it('shows an error with a retry when the Pokédex cannot load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const service = new FakePokemonService(makeSummaries(slugs))
    service.indexError = new Error('offline')
    const { user } = renderApp(service)

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the Pokédex")

    service.indexError = null
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('button', { name: /bulbasaur/i })).toBeInTheDocument()
  })
})
