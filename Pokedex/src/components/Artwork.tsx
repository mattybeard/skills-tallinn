import { useState } from 'react'
import { formatName, type Pokemon } from '../api'

interface ArtworkProps {
  pokemon: Pokemon
  shiny: boolean
  className?: string
}

export function Artwork({ pokemon, shiny, className = '' }: ArtworkProps) {
  const src = shiny ? pokemon.shinyArtwork : pokemon.artwork
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const alt = `${shiny ? 'Shiny ' : ''}${formatName(pokemon.name)} artwork`

  if (!src || failedSrc === src) {
    return (
      <span className={`artwork artwork-missing ${className}`} role="img" aria-label={`${alt} unavailable`}>
        ?
      </span>
    )
  }

  return (
    <span className={`artwork ${loadedSrc === src ? 'is-loaded' : ''} ${className}`}>
      <img
        key={src}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
      />
    </span>
  )
}
