# React components, hooks and accessibility

## Components

Components should obtain scoped dependencies from React Context, read observable state with `observer`, and invoke ViewModel actions. Props are fine for pure/presentational components: labels, layout preferences, item models and callbacks. Avoid passing shared service objects through multiple levels solely to reach a leaf component.

```tsx
import { observer } from "mobx-react-lite";

export const Results = observer(function Results() {
  const { items } = useAppServices();
  if (items.isLoading) return <p role="status">Loading items...</p>;
  if (items.error) return <p role="alert">{items.error}</p>;
  if (items.items.length === 0) return <p>No results found.</p>;
  return <ul>{items.items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
});
```

The `useAppServices` hook and `items` registration should be defined in the application root using the project's provider conventions.

## Hooks and lifecycle

- Don't use `useEffect` to synchronise something that can simply be derived during rendering.
- Use effects for actual integration with external systems, and clean up listeners, timers and subscriptions as needed.
- Avoid creating providers, long-lived clients or other shared services every render.
- Use `useMemo`/`useCallback` only for a demonstrated identity/performance requirement.
- Protect pending debounced callbacks against unmount and conflicting newer edits.

## Accessibility

Use semantic elements, label form inputs, preserve keyboard access, provide visible focus, give dialogs correct focus behaviour, announce important async feedback appropriately (`role="status"` or `role="alert"` where justified), and provide meaningful alternative text for informative images. Prefer accessible primitives supplied by an established UI library where appropriate.

Do not introduce a new UI framework just to comply with this skill.
