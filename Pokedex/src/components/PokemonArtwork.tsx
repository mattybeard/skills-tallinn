import { useState } from 'react'
import placeholderUrl from '../assets/placeholder.svg'

interface PokemonArtworkProps {
  /** Image URLs in fallback order. The placeholder graphic is used when all of them fail. */
  sources: string[]
  alt: string
  className?: string
}

export function PokemonArtwork({ sources, alt, className }: PokemonArtworkProps) {
  // Remount when the sources change, for example on a shiny toggle, so the fallback position resets.
  return <FallbackImage key={sources.join('|')} sources={sources} alt={alt} className={className} />
}

function FallbackImage({ sources, alt, className }: PokemonArtworkProps) {
  const [failedCount, setFailedCount] = useState(0)
  const src = sources[failedCount] ?? placeholderUrl

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (failedCount < sources.length) setFailedCount(failedCount + 1)
      }}
    />
  )
}
