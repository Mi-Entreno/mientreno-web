// Stand-in for the `server-only` package under test. The real module throws on
// import to stop server code leaking into a client bundle; that guard is a
// build-time concern and has nothing to enforce in a test run.
export {}
