export const SECTION_ROUTES = {
  journal: '/',
  notes: '/notes',
  ontology: '/ontology',
  predictions: '/predictions',
} as const

export type SectionRouteKey = keyof typeof SECTION_ROUTES

export function getSectionRoute(section: string): string | null {
  if (Object.prototype.hasOwnProperty.call(SECTION_ROUTES, section)) {
    return SECTION_ROUTES[section as SectionRouteKey]
  }
  return null
}
