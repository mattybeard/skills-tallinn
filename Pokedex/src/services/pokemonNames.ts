// Species whose official names contain punctuation or symbols that title-casing a slug cannot recover.
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'type-null': 'Type: Null',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  flabebe: 'Flabébé',
  'wo-chien': 'Wo-Chien',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'chi-yu': 'Chi-Yu',
}

export function titleCase(slug: string): string {
  return slug
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatDisplayName(slug: string): string {
  return DISPLAY_NAME_OVERRIDES[slug] ?? titleCase(slug)
}

/** Lower-cases text and keeps only letters and digits, so "Mr. Mime", "mr mime" and "mr-mime" compare equal. */
export function toSearchKey(text: string): string {
  return text
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function formatPokedexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}
