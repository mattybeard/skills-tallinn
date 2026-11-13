import { titleCase } from '../services/pokemonNames'
import styles from './TypeBadge.module.css'

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={styles.badge} data-type={type}>
      {titleCase(type)}
    </span>
  )
}

export function TypeBadgeList({ types }: { types: string[] }) {
  return (
    <span className={styles.list}>
      {types.map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </span>
  )
}
