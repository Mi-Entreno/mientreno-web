import { describe, expect, it } from "vitest"

import { MAX_VIDEO_BYTES } from "../dto/exercise.dto"
import { formatBytes, rejectVideo, rejectionMessage } from "./exercise.model"

function fakeFile(type: string, size: number, name = "clip.mp4"): File {
  // `File` in jsdom reads size from the parts, so stub it instead of allocating
  // 100 MB of memory.
  const file = new File([""], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("rejectVideo", () => {
  it("accepts every MIME type ExerciseVideoService allows", () => {
    const allowed = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
      "video/mpeg",
    ]

    for (const type of allowed) {
      expect(rejectVideo(fakeFile(type, 1024))).toBeNull()
    }
  })

  it("rejects an empty file, matching `file.isEmpty()`", () => {
    expect(rejectVideo(fakeFile("video/mp4", 0))).toEqual({ reason: "empty" })
  })

  it("rejects a type outside the allow-list", () => {
    // The backend checks the MIME type, not the extension, so a .mp4 the OS
    // typed as something else is still a 400.
    expect(rejectVideo(fakeFile("video/x-matroska", 1024, "clip.mp4"))).toEqual({
      reason: "type",
      actual: "video/x-matroska",
    })
  })

  it("rejects a file with no type at all", () => {
    expect(rejectVideo(fakeFile("", 1024))).toMatchObject({
      reason: "type",
      actual: "desconocido",
    })
  })

  it("accepts a file exactly at the 100 MB limit", () => {
    expect(rejectVideo(fakeFile("video/mp4", MAX_VIDEO_BYTES))).toBeNull()
  })

  it("rejects one byte over the limit", () => {
    // Spring answers MaxUploadSizeExceededException, which only reaches the
    // generic handler — an opaque 500 after transferring 100 MB. Catching it
    // here is the only way to say what actually went wrong.
    expect(rejectVideo(fakeFile("video/mp4", MAX_VIDEO_BYTES + 1))).toMatchObject({
      reason: "size",
    })
  })

  it("checks size before type, so an oversized file reports its real problem", () => {
    expect(rejectVideo(fakeFile("application/pdf", MAX_VIDEO_BYTES + 1))).toMatchObject({
      reason: "size",
    })
  })
})

describe("rejectionMessage", () => {
  it("names the actual size", () => {
    const message = rejectionMessage({ reason: "size", bytes: 150 * 1024 * 1024 })
    expect(message).toContain("150.0 MB")
    expect(message).toContain("100 MB")
  })

  it("names the offending type", () => {
    expect(rejectionMessage({ reason: "type", actual: "video/x-matroska" })).toContain(
      "video/x-matroska",
    )
  })
})

describe("formatBytes", () => {
  it("scales the unit", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
  })
})
