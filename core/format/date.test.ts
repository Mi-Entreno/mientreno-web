import { describe, expect, it } from "vitest"

import { dmyToIso, formatDisplayDate, isoToDmy, toIsoDate } from "./date"

/**
 * The backend has no global Jackson date config, so the format is per-field:
 * responses are ISO, but `PUT`/`POST /api/user-detail` carry
 * `@JsonFormat(pattern = "dd-MM-yyyy")`. Sending the wrong one is a 400.
 */
describe("isoToDmy", () => {
  it("converts an ISO date for the dd-MM-yyyy endpoints", () => {
    expect(isoToDmy("1990-04-23")).toBe("23-04-1990")
  })

  it("keeps single-digit days and months zero-padded", () => {
    expect(isoToDmy("2001-01-05")).toBe("05-01-2001")
  })

  it("returns null rather than sending malformed input", () => {
    expect(isoToDmy(null)).toBeNull()
    expect(isoToDmy("")).toBeNull()
    expect(isoToDmy("23-04-1990")).toBeNull()
    expect(isoToDmy("not-a-date")).toBeNull()
  })
})

describe("dmyToIso", () => {
  it("converts back", () => {
    expect(dmyToIso("23-04-1990")).toBe("1990-04-23")
  })

  it("rejects ISO input", () => {
    expect(dmyToIso("1990-04-23")).toBeNull()
  })
})

describe("toIsoDate", () => {
  it("passes ISO through", () => {
    expect(toIsoDate("1990-04-23")).toBe("1990-04-23")
  })

  it("normalises dd-MM-yyyy", () => {
    expect(toIsoDate("23-04-1990")).toBe("1990-04-23")
  })

  it("keeps the date part of a LocalDateTime", () => {
    expect(toIsoDate("2026-07-25T10:30:00")).toBe("2026-07-25")
  })

  it("returns null for junk", () => {
    expect(toIsoDate("")).toBeNull()
    expect(toIsoDate(null)).toBeNull()
    expect(toIsoDate("25/07/2026")).toBeNull()
  })
})

describe("round-tripping", () => {
  it("survives read -> form -> write", () => {
    // GET returns ISO -> the date input holds ISO -> PUT needs dd-MM-yyyy.
    const fromApi = "1988-12-31"
    expect(isoToDmy(toIsoDate(fromApi))).toBe("31-12-1988")
  })
})

describe("formatDisplayDate", () => {
  it("does not shift the day across timezones", () => {
    // `new Date("1990-01-01")` is UTC midnight and renders as 31 Dec 1989
    // anywhere west of Greenwich. Parsing into local parts avoids that.
    expect(formatDisplayDate("1990-01-01")).toContain("1990")
    expect(formatDisplayDate("1990-01-01")).toContain("1")
  })

  it("falls back for missing values", () => {
    expect(formatDisplayDate(null)).toBe("—")
  })
})
