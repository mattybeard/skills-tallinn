---
name: react-standards
description: Build, extend, debug and review React and TypeScript applications using MobX ViewModels, typed service providers, isolated API services, local UI state and human-readable code. Use for React application coding and reviews, including Vite projects and React-based PCF controls.
license: MIT
compatibility: React, TypeScript, MobX, mobx-react-lite. Framework-neutral; suitable for Vite and embedded React applications.
metadata:
  author: mattybeard
  version: "2.0"
---

# React development standards

Build predictable code that a human developer can understand, debug and safely modify after AI-generated changes.

These standards govern the application architecture, not a mandatory folder layout or UI library. Preserve existing project conventions unless the user requests a wider refactor or the convention blocks correct implementation. 

## Core architecture

Unless the repository explicitly documents a different architecture:

1. Use React functional components and TypeScript.
2. Use MobX for authoritative application state shared across components or workflows.
3. Use a central ViewModel for a small application, or feature-scoped ViewModels for larger applications. Do not introduce multiple overlapping sources of truth.
4. Register ViewModels and shared services in a typed application- or feature-scoped ServiceProvider and expose it through React Context.
5. Avoid passing shared ViewModels, state fields or service instances through long chains of component props. Props remain appropriate for presentational data and reusable UI elements.
6. Put each meaningful external integration behind its own service boundary; do not create a class for every individual endpoint.
7. Keep React components focused on rendering, collecting user input and invoking ViewModel actions.
8. Use component-local React hooks for genuinely local interaction concerns, including draft input and debounced commits.
9. Prefer readable, explicit code and the smallest change that solves the request.
10. Add or update meaningful tests when changing behaviour.
11. Minimize prop usage between components; prefer using context or shared ViewModels for widely needed state.
12. Use strongly typed objects and interfaces for all state, props, and service contracts to leverage TypeScript's type safety.

## Choosing state ownership

- **ViewModel:** committed shared data, selected entities used across components, filters/paging/sorting shared by a feature, loading and error states used by workflows, business operations and application-level modes.
- **React component:** draft input, focus, hover, menu/dialog visibility, isolated visual preferences, DOM refs and component-owned timer handles.
- A local draft may temporarily mirror a ViewModel value during editing; the ViewModel remains the source of truth for the committed value.
- A display mode belongs in the ViewModel when other components, business logic, persistence or application workflows depend on it. It may stay local if confined to one component's presentation.
- Prefer computed/derived values over storing synchronised copies of the same data.
- Components reading observables use `observer`. Update observables through MobX actions, including after `await` using an action or `runInAction`.

Read [state-management.md](references/state-management.md) when creating or changing ViewModels, component state, debounce behaviour or asynchronous state transitions.

## Components and hooks

- Components must not directly issue application HTTP requests, construct shared services, contain substantial business logic, or parse complex transport responses.
- Avoid effects for values that can be calculated during render or from MobX computed state.
- Clean up component-owned subscriptions, timers and effects on unmount when needed; guard against stale callbacks.
- Use stable keys, semantic HTML and accessible interaction controls. Do not add memoisation without a reason.
- UI libraries are project choices; do not introduce Fluent UI, Tailwind or another library unless asked or already established.

Read [react-patterns.md](references/react-patterns.md) when changing components, hooks, forms or accessibility behaviour.

## Services and dependency injection

- Use named, typed dependencies. A missing required dependency must fail clearly.
- Scope ServiceProviders intentionally; do not create a new container on each render.
- Services own endpoints, authentication integration, HTTP calls, transport types, response mapping and integration-specific error handling.
- Use typed models at service boundaries. Validate untrusted external responses when their shape cannot be trusted.
- Never bundle credentials or private API keys in frontend code, including public build-time environment variables.
- Prefer `return existingPromise` or `await existingPromise` over unnecessary `new Promise` wrappers. Preserve useful original error details.
- For fetch-based calls, check `response.ok`, support cancellation when appropriate, and prevent stale results from replacing newer ones.

Read [services.md](references/services.md) for service examples, error handling and typed provider patterns.

## Testing and verification

- Test non-trivial ViewModel behaviour and service response/error handling.
- Test meaningful user flows with a React component testing tool where available.
- Mock integration boundaries, not internal implementation details unnecessarily.
- Use the repository's existing test tools; for new Vite projects prefer Vitest and React Testing Library unless requirements say otherwise.
- Run available formatting, lint, typecheck, tests and build commands relevant to the change. Report commands actually executed and their results; never claim success without executing them.

Read [testing.md](references/testing.md) when adding features, tests or reviewing test coverage.

## Scope and review discipline

Review primarily the code added or changed by the task. Do not raise unrelated findings against existing approved patterns solely because a different design might be cleaner. Raise pre-existing issues only when they block the task, cause a build/runtime failure in the affected path, create a clear correctness or security issue relevant to the task, or are explicitly in scope. Do not perform unsolicited refactors.

Treat the following introduced issues as defects:
- UI components bypass integration services for application calls.
- Shared authoritative data has competing independent stores.
- Service registration and retrieval types/keys do not agree.
- Observables are mutated outside actions.
- Failed requests leave loading state permanently active or stale requests overwrite newer state.
- Required cleanup is missing from resources introduced by the change.
- Confidential secrets are added to a client bundle.
- An invoked ViewModel action does not exist.
- Claimed checks were not run.

Do **not** flag component-local draft state, component-owned debounce timers, concise direct Promise returns, or established project choices as architectural violations on their own.

## Implementation workflow

1. Inspect existing entry point, application root, provider, ViewModels, services, components and scripts relevant to the task.
2. Identify state ownership and affected dependency boundaries.
3. Make the smallest coherent change following the current codebase's conventions.
4. Update tests for changed behaviour and verify error/loading paths.
5. Run available relevant checks.
6. Review the diff against these standards, limited to the affected scope.

## Final response

Call the unslop skill when telling the user about any of your work.