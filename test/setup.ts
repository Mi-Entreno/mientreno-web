import "@testing-library/jest-dom/vitest"

// `serverEnv()` validates this on first use; without it every module that talks
// to the backend would throw during import in tests.
process.env.API_URL = "http://backend.test"

// The session cookie is encrypted with this (`server/session-crypto.ts`); like
// API_URL, it is read lazily and throws when missing.
process.env.SESSION_SECRET = "test-session-secret-with-at-least-32-chars"
