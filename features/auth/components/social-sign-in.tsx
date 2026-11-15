"use client"

import Script from "next/script"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { legalDocument } from "@/components/legal/documents"
import { Button } from "@/components/ui/button"
import { BarsLoader } from "@/components/ui/bars-loader"
import { appleClientId, appleRedirectUri, googleClientId } from "@/core/config/features"
import { ApiError } from "@/core/http/errors"

import {
  authRepository,
  type SignInResult,
  type SocialProvider,
  type SocialSignInInput,
} from "../api/auth.repository"
import { LegalLink } from "./legal-consent-field"

const GOOGLE_SDK = "https://accounts.google.com/gsi/client"
const APPLE_SDK =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/es_ES/appleid.auth.js"

const TERMS = legalDocument("terminos")
const PRIVACY = legalDocument("privacidad")

/*
 * The two SDKs, typed only as far as this file uses them. Neither ships types
 * worth a dependency for four calls.
 */
interface GoogleId {
  initialize(config: {
    client_id: string
    callback: (response: { credential?: string }) => void
    nonce: string
    ux_mode: "popup"
    use_fedcm_for_button?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type: "standard"
      theme: "outline" | "filled_black"
      size: "large"
      text: "continue_with"
      shape: "rectangular"
      width: number
      locale: string
    },
  ): void
}

interface AppleAuth {
  init(config: {
    clientId: string
    scope: string
    redirectURI: string
    usePopup: true
    nonce: string
    state: string
  }): void
  signIn(): Promise<{ authorization: { id_token: string; code?: string; state?: string } }>
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
    AppleID?: { auth: AppleAuth }
  }
}

/** 128 bits, hex. Fresh per attempt: a nonce is only worth anything if it is never reused. */
function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

interface SocialSignInProps {
  onSignedIn: (result: SignInResult) => void
  /** While the password form is submitting. */
  disabled?: boolean
}

/**
 * "Continuar con Google" / "Continuar con Apple".
 *
 * Both run the provider's own JS SDK in a popup and hand us an OpenID id token;
 * nothing here trusts it — `app/auth/social/[provider]` forwards it and the
 * backend verifies signature, audience, expiry and nonce. The nonce binds the
 * token to this attempt: Google embeds it as given, Apple embeds whatever we
 * pass, so we pass Apple the SHA-256 and send the raw value to the backend,
 * which accepts either form.
 *
 * A first sign-in with an unknown email creates a **trainer** account — hence
 * the "al continuar, aceptás" line, sent upstream as the same three consent
 * flags as the register checkbox. A student-only account is refused upstream
 * (403) before the identity gets linked to it.
 *
 * Each button only renders when its client id is configured, and the whole
 * block disappears when neither is.
 */
export function SocialSignIn({ onSignedIn, disabled }: SocialSignInProps) {
  const googleId = googleClientId()
  const appleId = appleClientId()
  const [pending, setPending] = useState<SocialProvider | null>(null)

  const submit = useCallback(
    async (provider: SocialProvider, input: SocialSignInInput) => {
      setPending(provider)
      try {
        onSignedIn(await authRepository.socialSignIn(provider, input))
      } catch (error) {
        // The backend's own wording covers every expected case: student-only
        // account (403), an existing account that cannot be linked on its own
        // (409, says how to fix it), provider not configured (503).
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos.",
        )
      } finally {
        setPending(null)
      }
    },
    [onSignedIn],
  )

  if (!googleId && !appleId) return null

  const busy = disabled || pending !== null

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-3 text-caption text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>

      {/*
        Capped at the width Google's rendered button can reach (GIS refuses more
        than 400px), so Apple's — ours, and otherwise full width — matches it.
      */}
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-3">
        {googleId && <GoogleButton clientId={googleId} busy={busy} onToken={submit} />}
        {appleId && (
          <AppleButton
            clientId={appleId}
            busy={busy}
            pending={pending === "apple"}
            onToken={submit}
          />
        )}
      </div>

      {pending === "google" && (
        <p className="flex items-center justify-center gap-2 text-caption text-muted-foreground">
          <BarsLoader /> Iniciando sesión con Google…
        </p>
      )}

      <p className="text-center text-caption text-pretty text-muted-foreground">
        Si es tu primera vez, al continuar con Google o Apple creamos tu cuenta de entrenador y
        aceptás los <LegalLink href={TERMS.href}>{TERMS.title.toLowerCase()}</LegalLink> y la{" "}
        <LegalLink href={PRIVACY.href}>{PRIVACY.title.toLowerCase()}</LegalLink>.
      </p>
    </div>
  )
}

/**
 * Google's own rendered button, not a lookalike: Google Identity Services only
 * hands out id tokens through its button or One Tap, and its branding rules ask
 * for the official one anyway.
 */
function GoogleButton({
  clientId,
  busy,
  onToken,
}: {
  clientId: string
  busy: boolean
  onToken: (provider: SocialProvider, input: SocialSignInInput) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && !!window.google)
  // The callback is registered once with the SDK; the ref keeps it current.
  const onTokenRef = useRef(onToken)
  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    const google = window.google
    if (!loaded || !google || !container.current) return
    const nonce = randomNonce()
    google.accounts.id.initialize({
      client_id: clientId,
      nonce,
      ux_mode: "popup",
      use_fedcm_for_button: true,
      callback: ({ credential }) => {
        if (credential) onTokenRef.current("google", { idToken: credential, nonce })
      },
    })
    google.accounts.id.renderButton(container.current, {
      type: "standard",
      theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: Math.min(container.current.offsetWidth || 400, 400),
      locale: "es-419",
    })
  }, [clientId, loaded])

  return (
    <>
      <Script src={GOOGLE_SDK} strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <div
        ref={container}
        aria-busy={busy}
        className="flex min-h-10 w-full justify-center aria-busy:pointer-events-none aria-busy:opacity-50"
      />
    </>
  )
}

/**
 * Apple's JS SDK does not render a button that adapts to our theme, so this is
 * ours — black with the white logo, which is one of the styles Apple's Human
 * Interface Guidelines allow.
 */
function AppleButton({
  clientId,
  busy,
  pending,
  onToken,
}: {
  clientId: string
  busy: boolean
  pending: boolean
  onToken: (provider: SocialProvider, input: SocialSignInInput) => void
}) {
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && !!window.AppleID)

  async function signIn() {
    const apple = window.AppleID
    if (!apple) return
    const nonce = randomNonce()
    const state = randomNonce()
    apple.auth.init({
      clientId,
      scope: "name email",
      redirectURI: appleRedirectUri() ?? `${window.location.origin}/login`,
      usePopup: true,
      nonce: await sha256Hex(nonce),
      state,
    })
    let response
    try {
      response = await apple.auth.signIn()
    } catch (error) {
      // Closing the popup is not an error worth a toast.
      const code = (error as { error?: string } | null)?.error
      if (code !== "popup_closed_by_user" && code !== "user_cancelled_authorize") {
        toast.error("No pudimos conectar con Apple. Intentá de nuevo.")
      }
      return
    }
    if (response.authorization.state !== state) {
      toast.error("No pudimos conectar con Apple. Intentá de nuevo.")
      return
    }
    onToken("apple", {
      idToken: response.authorization.id_token,
      nonce,
      authorizationCode: response.authorization.code ?? null,
    })
  }

  return (
    <>
      <Script src={APPLE_SDK} strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <Button
        type="button"
        size="lg"
        onClick={signIn}
        disabled={busy || !loaded}
        className="h-10 w-full gap-2 bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
      >
        {pending ? <BarsLoader /> : <AppleLogo />}
        Continuar con Apple
      </Button>
    </>
  )
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 814 1000" aria-hidden="true" className="size-4 fill-current">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  )
}
