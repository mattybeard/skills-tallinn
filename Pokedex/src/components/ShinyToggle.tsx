import { observer } from 'mobx-react-lite'
import { useService } from '../app/serviceContext'
import styles from './ShinyToggle.module.css'

export const ShinyToggle = observer(function ShinyToggle() {
  const pokedex = useService('pokedex')

  return (
    <button
      type="button"
      className={`button ${styles.toggle}`}
      aria-pressed={pokedex.isShiny}
      onClick={pokedex.toggleShiny}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"
          fill="currentColor"
        />
      </svg>
      Shiny
    </button>
  )
})
