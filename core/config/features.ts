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
 * and `/auth/brand/register` answers 404 to a bare fetch. Existing merchant
 * accounts are untouched — they still sign in and use their panel.
 */
export function isBrandSignupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BRAND_SIGNUP_ENABLED !== "false"
}
