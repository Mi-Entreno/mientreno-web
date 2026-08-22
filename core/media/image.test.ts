import { describe, expect, it } from "vitest"

import {
  MAX_IMAGE_BYTES,
  formatBytes,
  rejectImage,
  rejectionMessage,
} from "./image"

function file({ name = "foto.jpg", type = "image/jpeg", size = 1024 } = {}): File {
  // `size` is derived from the parts, so it has to be overridden on the File
  // itself rather than on the Blob it is built from.
  const handle = new File(["x"], name, { type })
  Object.defineProperty(handle, "size", { value: size })
  return handle
}

describe("rejectImage", () => {
  it("accepts every allowed type", () => {
    expect(rejectImage(file({ type: "image/jpeg" }))).toBeNull()
    expect(rejectImage(file({ name: "a.png", type: "image/png" }))).toBeNull()
    expect(rejectImage(file({ name: "a.webp", type: "image/webp" }))).toBeNull()
  })

  it("rejects an empty file before anything else", () => {
    expect(rejectImage(file({ size: 0 }))).toEqual({ reason: "empty" })
  })

  it("rejects a type that is not an allowed image", () => {
    expect(rejectImage(file({ name: "cv.pdf", type: "application/pdf" }))).toEqual({
      reason: "type",
      actual: "application/pdf",
    })
    expect(rejectImage(file({ name: "clip.mp4", type: "video/mp4" }))).toMatchObject({
      reason: "type",
    })
  })

  it("falls back to the extension when the browser reports no type", () => {
    expect(rejectImage(file({ name: "foto.PNG", type: "" }))).toBeNull()
    expect(rejectImage(file({ name: "notas.txt", type: "" }))).toMatchObject({ reason: "type" })
  })

  it("rejects a file over the maximum", () => {
    expect(rejectImage(file({ size: MAX_IMAGE_BYTES + 1 }))).toEqual({
      reason: "size",
      bytes: MAX_IMAGE_BYTES + 1,
    })
  })

  it("accepts a file exactly at the maximum", () => {
    expect(rejectImage(file({ size: MAX_IMAGE_BYTES }))).toBeNull()
  })
})

describe("rejectionMessage", () => {
  it("names the actual size and the limit", () => {
    const message = rejectionMessage({ reason: "size", bytes: 8_800_000 })

    expect(message).toContain("8,4 MB")
    expect(message).toContain("5,0 MB")
  })

  it("names the offending format", () => {
    expect(rejectionMessage({ reason: "type", actual: "application/pdf" })).toContain(
      "application/pdf",
    )
  })

  it("has copy for every reason", () => {
    expect(rejectionMessage({ reason: "empty" })).toBeTruthy()
  })
})

describe("formatBytes", () => {
  it("scales the unit", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5,0 MB")
  })
})
