# Services and dependencies

## Service boundaries

Use a service per meaningful external integration (for example, `ItemService`, `AddressLookupService`, `TelemetryService`), not per endpoint. Components call ViewModel actions; ViewModels orchestrate services. Services own transport-specific decisions, mapping and normalized errors.

```ts
export interface Item {
  id: string;
  name: string;
}

export class ItemService {
  constructor(private readonly baseUrl: string) {}

  async getItem(id: string, signal?: AbortSignal): Promise<Item> {
    const response = await fetch(`${this.baseUrl}/items/${encodeURIComponent(id)}`, { signal });
    if (!response.ok) {
      throw new Error(`Item request failed (${response.status})`);
    }
    const data: unknown = await response.json();
    if (
      typeof data !== "object" || data === null ||
      !("id" in data) || typeof data.id !== "string" ||
      !("name" in data) || typeof data.name !== "string"
    ) {
      throw new Error("Unexpected item response");
    }
    return { id: data.id, name: data.name };
  }
}
```

For complex API payloads, prefer a runtime schema library already used by the project. Keep raw DTOs out of the UI. Preserve original errors when possible and do not swallow failures with empty catches. Avoid unnecessary `new Promise` wrappers.

## Typed ServiceProvider

Prefer a typed, explicit registry for a new application. Below is one example, not a required implementation shape:

```ts
export interface AppServices {
  itemService: ItemService;
  items: ItemsViewModel;
}

export class ServiceProvider {
  constructor(private readonly services: AppServices) {}

  get<K extends keyof AppServices>(key: K): AppServices[K] {
    return this.services[key];
  }
}
```

Construct dependencies at the application root (or feature boundary), then provide one stable provider instance via React Context. If a template already uses a different provider, preserve it unless changing it is in scope or a real defect exists. Use mocks/fakes as constructor dependencies in tests.

## Requests and security

- Check response status; distinguish expected not-found/validation failures where useful.
- Use cancellation when unmounting, navigating or superseding an expensive request.
- Avoid race conditions from overlapping searches or saves.
- Do not add client secrets to bundles or `VITE_` variables. Use an appropriate backend/proxy or platform-managed token flow.
- Do not introduce retries blindly for writes, non-idempotent operations or rate-limited APIs.
- Only expose user-safe error text in the UI; preserve useful diagnostics in appropriate logging.
