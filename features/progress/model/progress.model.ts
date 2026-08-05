export interface ProgressEntry {
  id: number
  subscriptionId: number
  weightKg: number | null
  bodyFatPct: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  armsCm: number | null
  thighsCm: number | null
  /** Display URL through the media proxy. */
  photoUrl: string | null
  notes: string
  recordedAt: string
  createdAt: string
}

/** The numeric fields that can be plotted over time. */
export type MeasureKey =
  | "weightKg"
  | "bodyFatPct"
  | "chestCm"
  | "waistCm"
  | "hipsCm"
  | "armsCm"
  | "thighsCm"

export interface MeasureDefinition {
  key: MeasureKey
  label: string
  unit: string
}

export const MEASURES: MeasureDefinition[] = [
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "bodyFatPct", label: "Grasa corporal", unit: "%" },
  { key: "waistCm", label: "Cintura", unit: "cm" },
  { key: "chestCm", label: "Pecho", unit: "cm" },
  { key: "hipsCm", label: "Cadera", unit: "cm" },
  { key: "armsCm", label: "Brazos", unit: "cm" },
  { key: "thighsCm", label: "Muslos", unit: "cm" },
]

export function measureOf(key: MeasureKey): MeasureDefinition {
  return MEASURES.find((measure) => measure.key === key) ?? MEASURES[0]
}

export interface SeriesPoint {
  entryId: number
  /** Epoch milliseconds, for positioning on a time axis. */
  time: number
  value: number
  recordedAt: string
}

/**
 * Builds a plottable series for one measure, oldest first.
 *
 * Entries missing that measure are skipped rather than treated as zero — a
 * student who logged only their weight has nulls everywhere else, and plotting
 * those as 0 would draw a cliff that never happened.
 */
export function toSeries(entries: ProgressEntry[], key: MeasureKey): SeriesPoint[] {
  return entries
    .filter((entry) => entry[key] !== null)
    .map((entry) => ({
      entryId: entry.id,
      time: Date.parse(entry.recordedAt),
      value: entry[key] as number,
      recordedAt: entry.recordedAt,
    }))
    .filter((point) => Number.isFinite(point.time))
    .sort((a, b) => a.time - b.time)
}

/** Which measures any entry actually carries — the rest are not worth offering. */
export function availableMeasures(entries: ProgressEntry[]): MeasureDefinition[] {
  return MEASURES.filter((measure) => entries.some((entry) => entry[measure.key] !== null))
}

export interface MeasureDelta {
  first: number
  last: number
  change: number
  /** Null when there is a single point, so there is nothing to compare. */
  percent: number | null
}

export function deltaOf(points: SeriesPoint[]): MeasureDelta | null {
  if (points.length === 0) return null

  const first = points[0].value
  const last = points[points.length - 1].value
  const change = Math.round((last - first) * 10) / 10

  return {
    first,
    last,
    change,
    percent:
      points.length > 1 && first !== 0
        ? Math.round(((last - first) / first) * 1000) / 10
        : null,
  }
}
