import type { NextRequest } from "next/server"

import { proxyToUpstream } from "@/server/upstream"

/**
 * Authenticated proxy for a bank-transfer receipt.
 *
 * The backend deliberately does not publish the storage URL of a proof: it
 * carries a CBU, a name and amounts, and every storage provider we support
 * serves its files publicly (`FileController` is even allowlisted in
 * `SecurityConfig`). `GET /api/payments/bank-transfer/{id}/proof` returns the
 * bytes instead, after checking that whoever is asking is a party to the
 * payment.
 *
 * That check needs the session token, and an `<img src>` never sends one — the
 * same reason `app/api/media/[...path]` exists. This is a second, narrower
 * route rather than an entry in that one: `media` forwards anything under
 * `/api/files/**`, and widening it to a different upstream prefix would make it
 * a general forwarder. One id, one endpoint.
 *
 * Read-only: a proof is never modified through here.
 */
async function handler(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  // Anything but a plain id is a caller trying to reach a different endpoint
  // through this route.
  if (!/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ message: "Comprobante no encontrado" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }

  const response = await proxyToUpstream(req, `/api/payments/bank-transfer/${id}/proof`)

  // Private: this is one person's receipt, and shared caches must not keep it.
  if (response.ok) {
    response.headers.set("Cache-Control", "private, max-age=300")
  }

  return response
}

export { handler as GET, handler as HEAD }
