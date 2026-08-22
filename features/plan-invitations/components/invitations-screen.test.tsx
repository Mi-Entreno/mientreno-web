import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { InvitationsScreen } from "./invitations-screen"

/**
 * The split between this screen and "Mis alumnos".
 *
 * Both used to offer "invitar", which made them look like two ways into the
 * same job. This screen is now a queue: it reports state and routes the trainer
 * to the roster when they want to send something. The assertions below are that
 * contract, not the markup.
 */

const emptyPage = {
  content: [],
  number: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
}

const server = setupServer(
  http.get("*/api/backend/api/plan-invitations/sent", () => HttpResponse.json(emptyPage)),
  http.get("*/api/backend/api/plan-invitations/sent/counts", () =>
    HttpResponse.json({ pending: 0, accepted: 0, rejected: 0 }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <InvitationsScreen />
    </QueryClientProvider>,
  )
}

describe("InvitationsScreen", () => {
  it("offers no way to start an invitation", async () => {
    renderScreen()

    // The screen opens on the "PENDING" tab, so this is the empty copy for a
    // filter rather than for the whole history.
    await waitFor(() =>
      expect(screen.getByText(/no hay invitaciones acá/i)).toBeInTheDocument(),
    )

    expect(screen.queryByRole("button", { name: /enviar plan/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /invitar/i })).not.toBeInTheDocument()
  })

  it("points at the roster, which is where invitations start", async () => {
    renderScreen()

    const link = await screen.findByRole("link", { name: /ir a mis alumnos/i })
    expect(link).toHaveAttribute("href", "/dashboard/students")

    // The list is still loading when the link renders, so wait for the panel.
    expect(await screen.findByText(/se envían desde mis alumnos/i)).toBeInTheDocument()
  })
})
