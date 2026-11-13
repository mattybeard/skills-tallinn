import { PokeApiService, type PokemonService } from '../services/PokeApiService'
import { PokedexViewModel } from '../viewmodels/PokedexViewModel'

export interface AppServices {
  pokemonService: PokemonService
  pokedex: PokedexViewModel
}

export class ServiceProvider {
  readonly #services: AppServices

  constructor(services: AppServices) {
    this.#services = services
  }

  get<K extends keyof AppServices>(key: K): AppServices[K] {
    const service = this.#services[key]
    if (service === undefined) throw new Error(`Service "${key}" is not registered.`)
    return service
  }
}

export function createServiceProvider(pokemonService: PokemonService = new PokeApiService()): ServiceProvider {
  return new ServiceProvider({
    pokemonService,
    pokedex: new PokedexViewModel(pokemonService),
  })
}
