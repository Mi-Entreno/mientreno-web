import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { blockedReason, candidateState } from "../model/student-search.model"
import { studentSearchRepository } from "./student-search.repository"

let lastUrl: URL | null = null

const server = setupServer(
  http.get("*/api/backend/api/users/students/search", ({ request }) => {
    lastUrl = new URL(request.url)

    return HttpResponse.json({
      content: [
        {
          id: 42,
          fullName: "  María López  ",
          email: "m***@gmail.com",
          profileImageUrl: "http://localhost:8080/api/files/avatars/42/photo.jpg",
          location: "Rosario",
          alreadyMyStudent: false,
          pendingInvitationId: null,
        },
        {
          id: 43,
          fullName: null,
          email: null,
          profileImageUrl: null,
          location: null,
          alreadyMyStudent: true,
          pendingInvitationId: null,
        },
      ],
      number: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
      numberOfElements: 2,
      empty: false,
    })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
})
afterAll(() => server.close())

describe("studentSearchRepository.search", () => {
  it("trims the term and pages the way Spring expects", async () => {
    await studentSearchRepository.search("  maría  ", 1)

    expect(lastUrl?.searchParams.get("q")).toBe("maría")
    expect(lastUrl?.searchParams.get("page")).toBe("1")
    expect(lastUrl?.searchParams.get("size")).toBe("20")
  })

  it("maps names, avatars and the relationship flags", async () => {
    const page = await studentSearchRepository.search("maría", 0)

    expect(page.items[0].fullName).toBe("María López")
    expect(page.items[0].avatarUrl).toBe("/api/media/avatars/42/photo.jpg")
    expect(page.items[0].location).toBe("Rosario")
    expect(page.items[1].alreadyMyStudent).toBe(true)
  })

  it("gives a nameless account something to render", async () => {
    const page = await studentSearchRepository.search("maría", 0)

    expect(page.items[1].fullName).toBe("Alumno sin nombre")
    expect(page.items[1].email).toBeNull()
  })
})

describe("candidateState", () => {
  const base = {
    id: 1,
    fullName: "María",
    email: null,
    avatarUrl: null,
    location: null,
    alreadyMyStudent: false,
    pendingInvitationId: null,
  }

  it("marks an existing student as not invitable, with the reason", () => {
    const candidate = { ...base, alreadyMyStudent: true }

    expect(candidateState(candidate)).toBe("already-student")
    expect(blockedReason(candidate)).toBe("Ya es alumno tuyo")
  })

  it("blocks a second invitation while one is open", () => {
    // Sending another would be a 409 after the trainer finished the wizard.
    const candidate = { ...base, pendingInvitationId: 9 }

    expect(candidateState(candidate)).toBe("invitation-pending")
    expect(blockedReason(candidate)).toBe("Ya tiene una invitación pendiente")
  })

  it("has no reason to block anyone else", () => {
    expect(candidateState(base)).toBe("invitable")
    expect(blockedReason(base)).toBeNull()
  })
})
