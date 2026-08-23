import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { navItems } from "./nav-items"
import { Sidebar } from "./sidebar"

/**
 * Stands in for "render it and look at it" on the parts of the redesign that
 * can be decided from the DOM: which row is marked active, that the dumbbell
 * marker rides along with it, and that the profile and logout controls still
 * reach the same places the header does.
 */
const pathname = vi.fn(() => "/dashboard")
const push = vi.fn()
const refresh = vi.fn()

vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
  useRouter: () => ({ push, refresh }),
}))

const profile = vi.fn()
vi.mock("@/features/trainer-profile/hooks/use-trainer-profile", () => ({
  useTrainerProfile: () => profile(),
}))

function renderSidebar(currentPath = "/dashboard") {
  pathname.mockReturnValue(currentPath)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <Sidebar />
    </QueryClientProvider>,
  )
}

const MARKER = "svg[viewBox='0 0 14 44']"

beforeEach(() => {
  vi.clearAllMocks()
  profile.mockReturnValue({ data: { fullName: "Alex Ruiz", avatarUrl: "/api/media/a.png" } })
})

describe("Sidebar navigation", () => {
  it("keeps every nav item, pointing at the same routes", () => {
    renderSidebar()

    for (const item of navItems) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href)
    }
  })

  it("marks only the current section as active", () => {
    const { container } = renderSidebar("/dashboard/students")

    const active = container.querySelectorAll("a[aria-current='page']")
    expect(active).toHaveLength(1)
    expect(active[0]).toHaveAttribute("href", "/dashboard/students")

    // The dumbbell marker rides along: one in the whole sidebar, inside the
    // active row. Its enter animation replays because it mounts there.
    expect(container.querySelectorAll(MARKER)).toHaveLength(1)
    expect(active[0].querySelector(MARKER)).not.toBeNull()
  })

  it("keeps a nested route inside its section", () => {
    const { container } = renderSidebar("/dashboard/students/17")

    expect(container.querySelector("a[aria-current='page']")).toHaveAttribute(
      "href",
      "/dashboard/students",
    )
  })

  it("does not treat every route as the dashboard root", () => {
    const { container } = renderSidebar("/dashboard/plans")

    expect(container.querySelector("a[aria-current='page']")).toHaveAttribute(
      "href",
      "/dashboard/plans",
    )
  })
})

describe("Sidebar profile", () => {
  it("shows the trainer's name and links to the profile form", () => {
    renderSidebar()

    expect(screen.getByRole("link", { name: /Alex Ruiz/ })).toHaveAttribute(
      "href",
      "/dashboard/profile",
    )
  })

  /**
   * The rule this locks in: no name is painted until it is the right one.
   *
   * Two earlier versions each showed a value and then replaced it — the word
   * "Entrenador", and the token's first name ahead of the full one. Both read
   * as the app correcting itself.
   */
  it("paints no name at all while the profile is loading", () => {
    profile.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Sidebar initialName="Alex" />
      </QueryClientProvider>,
    )

    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    expect(screen.queryByText("Alex")).not.toBeInTheDocument()
    expect(screen.queryByText("Entrenador")).not.toBeInTheDocument()
  })

  it("shows the full name once, with no skeleton left behind", () => {
    const { container } = renderSidebar()

    expect(screen.getByText("Alex Ruiz")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  })

  it("uses the token's name for a trainer with no profile yet", () => {
    profile.mockReturnValue({ data: null, isLoading: false })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Sidebar initialName="Alex" />
      </QueryClientProvider>,
    )

    expect(screen.getByText("Alex")).toBeInTheDocument()
    expect(screen.queryByText("Entrenador")).not.toBeInTheDocument()
  })

  it("falls back to a generic label only when nothing knows the name", () => {
    profile.mockReturnValue({ data: null, isLoading: false })
    renderSidebar()

    expect(screen.getByRole("link", { name: /Entrenador/ })).toBeInTheDocument()
  })

  it("keeps settings reachable now that the header menu is desktop-hidden", () => {
    renderSidebar()

    expect(screen.getByRole("link", { name: "Ajustes" })).toHaveAttribute(
      "href",
      "/dashboard/settings",
    )
  })
})

describe("Sidebar logout", () => {
  it("posts to the existing endpoint and returns to login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchMock)

    renderSidebar()
    screen.getByRole("button", { name: "Cerrar sesión" }).click()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/auth/logout", { method: "POST" })
      expect(push).toHaveBeenCalledWith("/login")
      expect(refresh).toHaveBeenCalled()
    })

    vi.unstubAllGlobals()
  })
})
