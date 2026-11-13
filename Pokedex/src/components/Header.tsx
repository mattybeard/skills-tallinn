import { SearchBox } from './SearchBox'
import { ShinyToggle } from './ShinyToggle'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <h1 className={styles.title}>
          <span className={styles.logo} aria-hidden="true" />
          Pokédex
        </h1>
        <div className={styles.controls}>
          <SearchBox />
          <ShinyToggle />
        </div>
      </div>
    </header>
  )
}
