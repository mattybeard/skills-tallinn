import { formatName } from '../api'

export function TypeBadge({ type }: { type: string }) {
  return <span className={`type-badge type-${type}`}>{formatName(type)}</span>
}
