/**
 * Feature switches flipped from the environment, without touching code.
 *
 * `NEXT_PUBLIC_` on purpose, unlike `API_URL`: the value is not a secret, and
 * it has to reach client components (the login form's register links) as well
 * as server ones and the route handler. Next inlines it at build time, so every
 * read — page, link and handler — agrees on the same value for a given deploy.
 * Changing it therefore needs a rebuild; Railway does one on any variable edit.
 *
 * Read through a function rather than a module-level constant so tests can
 * flip it with `vi.stubEnv`. The literal `process.env.NEXT_PUBLIC_...` access
 * must stay as is: Next only inlines that exact expression.
 */

/**
 * Whether merchants can create accounts. On unless set to `"false"`, so a
 * deploy that never heard of the flag keeps behaving as before.
 *
 * Off hides it as if it never existed: no links, `/comercio/register` is a 404
 * and `/auth/brand/register` answers 404 to a bare fetch. The landing also
 * drops the merchant card and the footer's merchant login link, since with no
 * sign-up they only advertise a door nobody new can walk through.
 *
 * Existing merchant accounts are untouched: `/login` still routes them to
 * their panel, and `/comercio/login` still answers to anyone with the URL.
 */
export function isBrandSignupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BRAND_SIGNUP_ENABLED !== "false"
}

/**
 * Client ids for "Continuar con Google / Apple". Public by nature — they end up
 * in the provider's popup URL — and each must also be listed upstream
 * (`GOOGLE_CLIENT_IDS` / `APPLE_CLIENT_IDS`), since the backend checks the id
 * token's `aud` against them. Empty hides that provider's button.
 *
 * Apple's is the **Services ID** (web), not the app's bundle id.
 */
export function googleClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null
}

export function appleClientId(): string | null {
  return process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() || null
}

/**
 * Return URL registered for the Services ID. With the popup flow Apple never
 * navigates there, but it still has to match exactly. Defaults to this
 * origin's `/login`.
 */
export function appleRedirectUri(): string | null {
  return process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim() || null
}
