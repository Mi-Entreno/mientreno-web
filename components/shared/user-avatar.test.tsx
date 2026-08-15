import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UserAvatar } from "./user-avatar"

/**
 * The regression these cover: the hand-written version pointed `src` at
 * `/placeholder.svg` when the backend had no photo, so the image always loaded
 * and the initials were unreachable. "No photo shows initials" is the whole
 * contract of this component, so it is asserted directly rather than through
 * any one screen.
 */

/**
 * Base UI preloads with `new window.Image()` and only mounts the `<img>` once
 * that reports `loaded` — which jsdom never does, because it does not fetch
 * images. This stands in for a photo that loads, so the "photo wins" cases can
 * be asserted at all.
 */
function stubLoadableImages() {
  const original = window.Image

  class LoadedImage {
    complete = true
    naturalWidth = 1
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    referrerPolicy = ""
    crossOrigin: string | null = null
    set src(_value: string) {
      queueMicrotask(() => this.onload?.())
    }
  }

  vi.stubGlobal("Image", LoadedImage)
  return () => vi.stubGlobal("Image", original)
}

afterEach(() => vi.unstubAllGlobals())

describe("UserAvatar", () => {
  it("shows the initials when the backend sends no photo", () => {
    render(<UserAvatar name="María López García" src={null} />)

    expect(screen.getByText("ML")).toBeInTheDocument()
    // No <img> at all: an image element with a placeholder src is what broke
    // this before, and it also costs a request per avatar.
    expect(document.querySelector("img")).toBeNull()
  })

  it("treats an empty string as no photo", () => {
    render(<UserAvatar name="Alex Ruiz" src="" />)

    expect(screen.getByText("AR")).toBeInTheDocument()
    expect(document.querySelector("img")).toBeNull()
  })

  it("falls back to an icon rather than inventing a letter for an unnamed person", () => {
    render(<UserAvatar name={null} src={null} />)

    expect(screen.getByLabelText("Sin foto de perfil")).toBeInTheDocument()
  })

  it("does not read a blank name as a name", () => {
    render(<UserAvatar name="   " src={null} />)

    expect(screen.getByLabelText("Sin foto de perfil")).toBeInTheDocument()
  })

  it("shows the photo, not the initials, when there is one", async () => {
    stubLoadableImages()
    render(<UserAvatar name="Alex Ruiz" src="/api/media/avatars/7/photo.jpg" />)

    await waitFor(() =>
      expect(document.querySelector("img")).toHaveAttribute(
        "src",
        "/api/media/avatars/7/photo.jpg",
      ),
    )
    expect(screen.queryByText("AR")).not.toBeInTheDocument()
  })

  it("leaves the photo undescribed, since every caller names the person alongside", async () => {
    stubLoadableImages()
    render(<UserAvatar name="Alex Ruiz" src="/api/media/avatars/7/photo.jpg" />)

    await waitFor(() => expect(document.querySelector("img")).toHaveAttribute("alt", ""))
  })
})
