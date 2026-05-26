export type PremiereRequirement =
  | 'world'
  | 'international'
  | 'north_american'
  | 'regional'
  | 'none'

export type FestivalGrade = 'A' | 'B' | 'C' | 'D'

export type FestivalStatus =
  | 'open'
  | 'closing_soon'
  | 'closed'
  | 'upcoming'
  | 'previous_edition'
  | 'unknown'

export interface Festival {
  id: string
  name: string
  slug: string
  country: string
  city: string | null
  website_url: string | null
  submission_url: string | null
  premiere_requirement: PremiereRequirement
  oscar_qualifying: boolean
  grade: FestivalGrade | null
  submission_price_usd: number | null
  waiver_available: boolean
  deadline: string | null
  early_deadline: string | null
  festival_start_date: string | null
  festival_end_date: string | null
  festival_dates_raw: string | null
  status: FestivalStatus
  enrichment_confidence: string | null
  notes: string | null
  last_checked_at: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface FestivalFilters {
  search: string
  country: string[]
  grade: FestivalGrade[]
  status: FestivalStatus[]
  premiere_requirement: PremiereRequirement[]
  oscar_qualifying: 'all' | 'yes' | 'no'
  maxPrice: number | null
}

export const DEFAULT_FILTERS: FestivalFilters = {
  search: '',
  country: [],
  grade: [],
  status: ['open'],
  premiere_requirement: [],
  oscar_qualifying: 'all',
  maxPrice: null,
}

export const STATUS_LABELS: Record<FestivalStatus, string> = {
  open: 'Open',
  closing_soon: 'Closing Soon',
  closed: 'Closed',
  upcoming: 'Upcoming',
  previous_edition: 'Previous Edition',
  unknown: 'Unknown',
}

export const PREMIERE_LABELS: Record<PremiereRequirement, string> = {
  world: 'World Premiere',
  international: 'International Premiere',
  north_american: 'North American Premiere',
  regional: 'Regional Premiere',
  none: 'No Requirement',
}

export const GRADE_LABELS: Record<FestivalGrade, string> = {
  A: 'Tier A',
  B: 'Tier B',
  C: 'Tier C',
  D: 'Tier D',
}
