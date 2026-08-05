"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ApiError } from "@/core/http/errors"

/**
 * Auth failures are handled here rather than inside the HTTP client.
 *
 * The previous `apiFetch` set `window.location.href = "/login"` on any 401,
 * from deep inside the transport layer — which raced with the router, made the
 * function untestable and left callers no way to handle the case themselves.
 * The client now throws a typed `ApiError`, and the app decides here what a
 * failure means globally.
 *
 * The handler subscribes to the caches in an effect instead of being passed to
 * `new QueryCache({ onError })` so it can close over the current router without
 * reading a ref during render.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => {
              // Retrying an auth or validation failure only delays the message.
              if (error instanceof ApiError) {
                if (error.isAuthFailure) return false
                if (error.kind === "validation") return false
                if (error.status !== null && error.status >= 400 && error.status < 500) return false
              }
              return count < 2
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  )

  useEffect(() => {
    const handleError = (error: unknown) => {
      if (!(error instanceof ApiError)) return

      // 401 means the session is gone: the proxy already tried to refresh,
      // failed, and cleared the cookie on the way out.
      if (error.status === 401) {
        client.clear()
        router.replace("/login")
        return
      }

      // 403 is a live session lacking the required role or ownership. Staying
      // put and explaining beats bouncing the user to login.
      if (error.status === 403) {
        toast.error(error.message)
      }
    }

    const unsubscribeQueries = client.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        handleError(event.action.error)
      }
    })

    const unsubscribeMutations = client.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        handleError(event.action.error)
      }
    })

    return () => {
      unsubscribeQueries()
      unsubscribeMutations()
    }
  }, [client, router])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
