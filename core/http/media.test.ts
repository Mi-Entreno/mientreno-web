import { describe, expect, it } from "vitest"

import { toMediaUrl, toMediaUrlOr } from "./media"

describe("toMediaUrl", () => {
  it("rewrites a locally-stored file to the authenticated media proxy", () => {
    // LocalFileStorageService builds `${baseUrl}/api/files/${key}`, and
    // /api/files/** requires a Bearer token an <img> can never send.
    expect(toMediaUrl("http://localhost:8080/api/files/avatars/42/photo.jpg")).toBe(
      "/api/media/avatars/42/photo.jpg",
    )
  })

  it("keeps nested keys intact", () => {
    expect(toMediaUrl("http://localhost:8080/api/files/videos/2026/07/clip.mp4")).toBe(
      "/api/media/videos/2026/07/clip.mp4",
    )
  })

  it("passes through S3 and CDN URLs untouched", () => {
    // With storage.provider=s3 the backend returns already-public URLs.
    const cdn = "https://cdn.example.com/uploads/avatar.png"
    expect(toMediaUrl(cdn)).toBe(cdn)
  })

  it("leaves an already-proxied URL alone", () => {
    expect(toMediaUrl("/api/media/avatars/1.png")).toBe("/api/media/avatars/1.png")
  })

  it("returns null for missing or blank values", () => {
    expect(toMediaUrl(null)).toBeNull()
    expect(toMediaUrl(undefined)).toBeNull()
    expect(toMediaUrl("   ")).toBeNull()
  })

  it("returns null when the file key is empty", () => {
    expect(toMediaUrl("http://localhost:8080/api/files/")).toBeNull()
  })
})

describe("toMediaUrlOr", () => {
  it("falls back to the placeholder", () => {
    expect(toMediaUrlOr(null, "/placeholder.svg")).toBe("/placeholder.svg")
  })
})
