# State management and ViewModels

## ViewModel scope

Small, cohesive apps may use one application ViewModel. Split into feature ViewModels when independent screens/workflows make a single class unwieldy. A feature should not be given its own ViewModel merely to create more layers. Keep cross-feature shared state in a clearly owned application service or parent ViewModel rather than copying it.

Use `makeAutoObservable` or `makeObservable` consistently with the existing project. Use intention-revealing actions (`searchItems`, `selectItem`, `clearError`) for meaningful operations; retain an existing generic setter where appropriate. Use `observer` on components that read observable state.

```ts
import { makeAutoObservable, runInAction } from "mobx";
import type { ItemService, Item } from "../services/ItemService";

export class ItemsViewModel {
  items: Item[] = [];
  query = "";
  isLoading = false;
  error: string | null = null;
  private requestVersion = 0;

  constructor(private readonly itemService: ItemService) {
    makeAutoObservable(this, { itemService: false, requestVersion: false });
  }

  setQuery(query: string): void {
    this.query = query;
  }

  async searchItems(): Promise<void> {
    const version = ++this.requestVersion;
    this.isLoading = true;
    this.error = null;
    try {
      const items = await this.itemService.search(this.query);
      runInAction(() => {
        if (version !== this.requestVersion) return;
        this.items = items;
      });
    } catch (error) {
      runInAction(() => {
        if (version !== this.requestVersion) return;
        this.error = error instanceof Error ? error.message : "Search failed";
      });
    } finally {
      runInAction(() => {
        if (version === this.requestVersion) this.isLoading = false;
      });
    }
  }
}
```

This is a simple latest-request-wins pattern. If cancelling saves meaningful work, use `AbortController` through the service as well. Do not use request-version counters as a universal requirement. Clear errors and loading state for the current request on both success and failure.

## Local drafts and debounce

A component may keep a draft value in `useState` and a timer in `useRef`, even when the committed value is in MobX. Cancel timers on unmount; decide explicitly whether blur commits immediately or discards the pending change.

```tsx
const [draft, setDraft] = React.useState(vm.query);
const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

React.useEffect(() => () => clearTimeout(timer.current), []);

const onChange = (value: string): void => {
  setDraft(value);
  clearTimeout(timer.current);
  timer.current = setTimeout(() => vm.setQuery(value), 300);
};

const onBlur = (): void => {
  clearTimeout(timer.current);
  vm.setQuery(draft);
};
```

Synchronise a local draft with external committed-value changes only when the product's intended editing behaviour calls for it; blindly mirroring every ViewModel update can overwrite in-progress user edits.

## Rules of thumb

- Computed values should be derived instead of stored redundantly.
- UI-only modal, focus or hover state usually stays local.
- Shared search filters, selected items and workflow state usually belong to a ViewModel.
- Use `runInAction` or an action method after asynchronous suspension; do not rely on the action context carrying across an `await`.
- Do not add a second independent global state framework without an explicit need.
