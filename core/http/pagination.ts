/**
 * Spring `Page<T>` interop.
 *
 * Five endpoints return a paginated body — `/api/trainers`,
 * `/api/notifications`, `/api/catalog-exercises`, `/api/foods` and
 * `/api/trainers/{id}/reviews` — and the backend (Spring Boot 3.5) serialises
 * `PageImpl` directly, without `spring.data.web.pageable.serialization-mode`
 * configured. That shape is explicitly documented as unstable across versions,
 * so it is confined to this module: features consume `PageResponse<T>` and a
 * change upstream is a one-file fix here.
 */

/** Literal mirror of Spring's default `PageImpl` JSON. */
export interface SpringPage<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

/** The shape features and components actually use. */
export interface PageResponse<T> {
  items: T[]
  /** Zero-based, as Spring numbers pages. */
  page: number
  size: number
  totalItems: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  isEmpty: boolean
}

export interface PageParams {
  page?: number
  size?: number
}

export const DEFAULT_PAGE_SIZE = 20

/**
 * Maps a Spring page, applying `mapItem` to each element so callers get domain
 * models rather than DTOs. Missing fields are derived instead of trusted:
 * `totalPages` and the first/last flags are absent from some serialisation
 * modes.
 */
export function mapPage<TDto, TModel>(
  page: SpringPage<TDto>,
  mapItem: (dto: TDto) => TModel,
): PageResponse<TModel> {
  const size = page.size > 0 ? page.size : DEFAULT_PAGE_SIZE
  const totalElements = page.totalElements ?? page.content.length
  const totalPages = page.totalPages ?? Math.max(1, Math.ceil(totalElements / size))
  const number = page.number ?? 0

  return {
    items: page.content.map(mapItem),
    page: number,
    size,
    totalItems: totalElements,
    totalPages,
    isFirst: page.first ?? number === 0,
    isLast: page.last ?? number >= totalPages - 1,
    isEmpty: page.empty ?? page.content.length === 0,
  }
}

/** Serialises page params the way Spring's `Pageable` resolver expects. */
export function pageQuery({ page, size }: PageParams = {}): Record<string, string> {
  const query: Record<string, string> = {}
  if (page !== undefined) query.page = String(page)
  if (size !== undefined) query.size = String(size)
  return query
}

/** `getNextPageParam` for `useInfiniteQuery`. */
export function nextPageParam<T>(last: PageResponse<T>): number | undefined {
  return last.isLast ? undefined : last.page + 1
}
