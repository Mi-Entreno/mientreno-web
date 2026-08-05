import "@testing-library/jest-dom/vitest"

// `serverEnv()` validates this on first use; without it every module that talks
// to the backend would throw during import in tests.
process.env.API_URL = "http://backend.test"
