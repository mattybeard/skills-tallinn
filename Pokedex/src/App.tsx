import { useEffect } from 'react'
import { useService } from './app/serviceContext'
import { Header } from './components/Header'
import { PokedexContent } from './components/PokedexContent'
import { PokemonDetailDialog } from './components/PokemonDetailDialog'
import styles from './App.module.css'

export function App() {
  const pokedex = useService('pokedex')

  useEffect(() => {
    void pokedex.loadIndex()
  }, [pokedex])

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <PokedexContent />
      </main>
      <footer className={styles.footer}>
        Data from{' '}
        <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">
          PokéAPI
        </a>
        . Pokémon and Pokémon character names are trademarks of Nintendo.
      </footer>
      <PokemonDetailDialog />
    </div>
  )
}
