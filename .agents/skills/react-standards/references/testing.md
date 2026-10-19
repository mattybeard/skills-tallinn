# Testing and validation

Use the existing repository's test runner. In a new Vite/React project, prefer Vitest and React Testing Library when there is no established alternative.

## What to test

- ViewModel actions: normal results, failures, empty results and latest-request-wins behaviour where relevant.
- Services: successful response parsing, non-2xx status, invalid payload and cancellation if supported.
- Components: user-visible outcomes and meaningful interactions, not internal MobX implementation details.
- PCF-specific output and lifecycle behaviour is covered by `pcf-standards` when applicable.

Prefer injecting mocked or fake services through the ServiceProvider. Avoid live external API calls in routine unit tests. Add integration tests only when the repository supports the required environment.

## Verification

Inspect `package.json` and run available relevant commands, typically typecheck, lint, tests and build. Do not assume all script names exist; do not claim unexecuted checks passed. Document concrete errors and distinguish pre-existing failures from introduced failures when the evidence supports it.

Review only the requested change unless wider review is requested. An existing implementation style is not automatically a defect.
