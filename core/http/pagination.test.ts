import { describe, expect, it } from "vitest"

import { mapPage, nextPageParam, pageQuery, type SpringPage } from "./pagination"

/** Shape Spring Boot 3.5 emits when serialising `PageImpl` directly. */
function springPage<T>(content: T[], overrides: Partial<SpringPage<T>> = {}): SpringPage<T> {
  return {
    content,
    number: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    numberOfElements: content.length,
    empty: content.length === 0,
    ...overrides,
  }
}

describe("mapPage", () => {
  it("maps items and flattens the page envelope", () => {
    const page = springPage([{ id: 1 }, { id: 2 }], {
      number: 1,
      totalElements: 42,
      totalPages: 3,
      first: false,
      last: false,
    })

    expect(mapPage(page, (dto) => dto.id)).toEqual({
      items: [1, 2],
      page: 1,
      size: 20,
      totalItems: 42,
      totalPages: 3,
      isFirst: false,
      isLast: false,
      isEmpty: false,
    })
  })

  it("derives totalPages and flags when the backend omits them", () => {
    // Spring's serialisation of these fields is version-dependent, which is why
    // the shape is confined to this module.
    const page = {
      content: [{ id: 1 }],
      number: 2,
      size: 10,
      totalElements: 25,
    } as SpringPage<{ id: number }>

    const result = mapPage(page, (dto) => dto.id)

    expect(result.totalPages).toBe(3)
    expect(result.isFirst).toBe(false)
    expect(result.isLast).toBe(true)
  })

  it("handles an empty page without dividing by zero", () => {
    const result = mapPage(springPage<{ id: number }>([], { size: 0 }), (dto) => dto.id)

    expect(result.items).toEqual([])
    expect(result.isEmpty).toBe(true)
    expect(result.totalPages).toBeGreaterThanOrEqual(1)
  })
})

describe("nextPageParam", () => {
  it("advances until the last page", () => {
    const page = mapPage(springPage([{ id: 1 }], { number: 0, last: false }), (d) => d.id)
    expect(nextPageParam(page)).toBe(1)
  })

  it("stops on the last page", () => {
    const page = mapPage(springPage([{ id: 1 }], { number: 2, last: true }), (d) => d.id)
    expect(nextPageParam(page)).toBeUndefined()
  })
})

describe("pageQuery", () => {
  it("omits undefined params", () => {
    expect(pageQuery({ page: 0 })).toEqual({ page: "0" })
    expect(pageQuery()).toEqual({})
  })
})
