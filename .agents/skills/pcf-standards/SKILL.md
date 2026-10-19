---
name: pcf-standards
description: Build, extend, debug and review React-based Power Apps Component Framework controls using the PCF_HelloWorldTemplate patterns. Use alongside react-standards for MobX, ViewModels, ServiceProvider and component conventions, with additional PCF lifecycle, Dataverse and bound input/output requirements.
license: MIT
compatibility: TypeScript React PCF controls with pcf-scripts, MobX, mobx-react-lite and optionally Fluent UI.
metadata:
  author: mattybeard
  version: "2.0"
  reference-repository: "https://github.com/mattybeard/PCF_HelloWorldTemplate"
---

# React PCF control standards

**Load and apply `react-standards` first** for general React architecture, ViewModel design, local state, service boundaries, code readability, testing and implementation workflow. If the other skill is not installed or accessible, follow existing project architecture and apply the PCF-specific rules below; do not pretend the other skill was loaded.

For controls derived from `PCF_HelloWorldTemplate`, treat the existing repository as the approved baseline. Preserve its established choices unless the user requests a refactor or a choice causes a real issue in the affected code path. Do not replace the template's ServiceProvider, lifecycle implementation or component structure simply to achieve abstract consistency with new React projects.

## PCF-specific architecture

1. The control has **one control-scoped central ViewModel**, even though general React projects may use multiple feature ViewModels. Do not introduce an unrelated second central store without explicit request.
2. Keep the ViewModel and shared integrations in one control-scoped `ServiceProvider`, exposed to React through its existing `ServiceProviderContext`.
3. Keep Dataverse interactions exclusively inside `DataverseService`.
4. Put third-party integrations in their own meaningful service class and register them in the existing provider.
5. Keep committed PCF bound/input/output state in the ViewModel. Do not duplicate it as an independent authoritative React state store.
6. Local React draft input, component-owned debouncing, dialog state and focus state remain valid; a delayed local commit may update the ViewModel and request a PCF output notification.
7. For changes within the existing template, preserve consistent legacy registration keys such as `vm` and `dv`. An untyped service map is not itself a defect in approved baseline code. Use a typed provider for entirely new React applications following `react-standards`.

## DataverseService

Only `DataverseService` may contain:
- `context.webAPI` calls and Dataverse create/retrieve/update/delete operations.
- OData / FetchXML construction and Custom API invocation.
- Dataverse request configuration, mapping and integration-specific error normalization.

Do not use `context.webAPI` inside React components or ViewModels. Prefer typed application-level models over leaking raw entity payloads into presentation code. Follow the existing template's context-handling pattern. Avoid unnecessary `new Promise` wrappers in new or modified methods, but do not rewrite unrelated existing wrappers solely for style.

## PCF input/output lifecycle

- Inspect `ControlManifest.Input.xml`, `index.ts`, the ViewModel, ServiceProvider, services and affected components before lifecycle changes.
- Translate framework inputs into authoritative committed ViewModel state in the existing `updateView` lifecycle; avoid resets that overwrite an in-progress local draft unnecessarily.
- Keep `getOutputs` consistent with manifest output names and types. Return values based on committed ViewModel output state.
- Invoke `notifyOutputChanged` intentionally when a meaningful output has changed. Prevent redundant updates or re-entrant notification loops caused by ordinary `updateView` cycles.
- Update the manifest only when properties, output bindings, resources, features or permissions genuinely change.
- Respect existing React-root management and rendering patterns; do not treat recreation/render choices as a defect without evidence of a failure.
- Keep control-level subscriptions, MobX reactions and other long-lived resources cleaned up in the appropriate lifecycle, including `destroy` when they belong to the PCF control.
- Component-owned effects and timers can remain inside the React lifecycle; an otherwise empty `destroy` is fine if no control-level cleanup is needed.
- Do not flag existing `DataverseService` replacement/re-registration during `updateView` as a defect unless it causes an affected feature to fail.

## PCF UI and environment

Use Fluent UI where the project already uses it or the control needs its established patterns; it is not a requirement for the shared React skill. Keep controls keyboard-accessible, labelled and responsive to the host's dimensions where applicable. Do not embed secrets or confidential API keys in PCF assets; use supported server-side or managed authentication where required. Respect hosting constraints in model-driven and canvas apps when relevant.

## Review scope and blockers

Review additions and changed paths only, unless requested otherwise. Raise pre-existing failures only when directly relevant to the task.

Treat introduced issues as defects when:
- Components or ViewModels call Dataverse directly.
- Output names/types disagree with the manifest or notifications cause output loops.
- Shared committed bound values have conflicting authoritative stores.
- A new resource or long-lived subscription leaks across control lifecycle.
- A new service is registered under one key but fetched under another.
- A failed async operation leaves control loading state permanently active.
- A private credential is exposed in the PCF bundle.

Do **not** flag on their own:
- Local draft `useState` or local `useRef` timers that commit to bound outputs.
- Existing untyped ServiceProvider storage, valid short keys, root-render patterns, or approved re-registration behaviour.
- An empty `destroy` without a control-owned resource needing cleanup.
- Existing Promise wrappers in otherwise unaffected code.

## Workflow

1. Apply `react-standards` to the affected React and service code.
2. Inspect the PCF manifest, `index.ts`, provider, ViewModel, DataverseService and relevant components.
3. Determine which values are framework-bound and which state is temporary UI state.
4. Put Dataverse calls in `DataverseService` and external integrations in dedicated services.
5. Ensure new output changes notify the framework without loops.
6. Test relevant ViewModel, service and output behaviour with available test infrastructure.
7. Run relevant repository lint, TypeScript, test and build scripts, including PCF build when available.
8. Review only the changed or directly affected code; avoid unrelated template refactors.

## Final response

Briefly explain what changed, how ViewModel and service boundaries were maintained, which commands actually ran and their results, and any remaining relevant issue. Never claim a PCF build or other check succeeded unless executed.
